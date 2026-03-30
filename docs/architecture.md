# VibeCMS System Architecture

## About This Document

**Purpose:** Component diagram and data flow defining how the system is structured. The authoritative reference for system boundaries and communication patterns.

**Consistency requirements:** The architecture described here aligns with the active codebase: a minimal Go Kernel augmented by gRPC/Tengo Extensions and a React Micro-frontend Admin UI.

VibeCMS is architected on a "Kernel + Extensions" model. The core system (the "Kernel") is deliberately minimal, providing only essential infrastructure like routing, authentication, content nodes, and an event bus. All other features (such as Media Management, Email, or SEO) are implemented as independent Extensions.

This decentralized architecture prevents monolith bloat, ensures high performance (sub-50ms TTFB), and provides a secure, capability-based sandboxing environment for third-party business logic.

---

## Component Diagram

```mermaid
graph TB
    subgraph "Public Interface"
        Visitor((End User))
        Admin((Administrator))
    end

    subgraph "Admin SPA (React + Vite)"
        AdminShell[CMS Core Shell]
        MFE[Extension Micro-Frontends]
    end

    subgraph "VibeCMS Kernel (Go)"
        Router[Fiber Router]
        AuthSvc[Auth & RBAC]
        ContentSvc[Content Nodes & Rendering]
        
        subgraph "Internal Infrastructure"
            EventBus[Async Event Bus]
            PluginMgr[Extension Loader & Proxy]
        end
        
        CoreAPI[CoreAPI Interface]
    end

    subgraph "Extensions Layer"
        NativeExt[Tengo Scripting Extensions]
        ExternalExt[gRPC Plugins (Go Binaries)]
    end

    subgraph "Persistence"
        PostgreSQL[(PostgreSQL JSONB)]
        Storage[Local / S3 Storage]
    end

    %% Routing
    Visitor --> Router
    Admin --> AdminShell
    AdminShell --> MFE
    
    AdminShell -->|/admin/api| Router
    MFE -->|/admin/api/ext/*| Router

    %% Internal
    Router --> AuthSvc
    Router --> ContentSvc
    Router --> PluginMgr

    %% Core Proxying to Extensions
    PluginMgr -->|Proxy HTTP RPC| ExternalExt
    PluginMgr -->|Mount Hooks| NativeExt
    
    %% Extensions talking back to Core
    ExternalExt -->|Invoke gRPC| CoreAPI
    NativeExt -->|VM Callbacks| CoreAPI
    
    CoreAPI --> ContentSvc
    CoreAPI --> EventBus

    ContentSvc <--> PostgreSQL
    ExternalExt <--> Storage
```

---

## The Kernel vs. Extensions Paradigm

### 1. The Kernel (Core)
The VibeCMS core provides infrastructure that cannot be reasonably outsourced.
- **Content Nodes:** Unified storage (`content_nodes` table) using PostgreSQL JSONB for schema-less block data.
- **CoreAPI:** A strict interface (35+ methods) that forms the only bridge between the Core and Extensions.
- **Capability Guard:** RBAC for Extensions. Plguins must declare permissions (`nodes:read`, `email:send`) in `extension.json` which CoreAPI enforces.
- **Plugin Manager:** Handles the lifecycle (boot, crash handling, shutdown) of gRPC binaries.

### 2. Extensions
Extensions implement the actual CMS features. There are two execution environments:
- **gRPC Plugins:** Standalone Go binaries communicating via HashiCorp's `go-plugin`. They handle heavy lifting, custom database migrations, and complex business logic.
- **Tengo Scripts:** An embedded, sandboxed scripting VM (`.tgo` files) used for lightweight hooks (e.g., injecting variables on `node.created`), bypassing the need for compiled binaries.

### 3. The React Micro-Frontend (Admin UI)
The administration panel abandons traditional monolithic React apps.
- **The Shell:** Contains only the login screen, sidebar, and dashboard. Exposes core libraries (`react`, `react-dom`, `@radix-ui`) on `window.__VIBECMS_SHARED__`.
- **The Fragments:** Extensions provide their own pre-compiled Vite ES Module bundles. The CMS dynamically imports these modules when an administrator navigates to `/admin/extensions/:slug`.

---

## Data Flow Examples

### 1. Extension Mounting & Admin Routing
1. **Boot:** The Kernel scans `extensions/`, reads `extension.json`, and boots the gRPC binary.
2. **Registration:** The extension calls `CoreAPI.RegisterRoute` or declares UI routes in its manifest.
3. **UI Request:** Admin clicks the extension icon. The React Shell dynamically loads the JS module from `/admin/api/ext/:slug/assets/main.js`.
4. **Proxy Request:** The React component makes a fetch to `/admin/api/ext/:slug/my-data`.
5. **Delegation:** The Kernel proxy intercepts this, validates auth, and issues a `HandleHTTPRequest` gRPC call to the Extension binary.

### 2. Asynchronous Events (e.g. Email Dispatch)
1. **Trigger:** A Custom Form extension receives a submission.
2. **Action:** The extension calls `CoreAPI.Emit("form.submitted", {data})`.
3. **Bus Routing:** The Kernel's in-memory Event Bus receives the payload.
4. **Subscription:** The Email Provider extension (listening to `form.submitted`) picks up the payload and dispatches an email via SMTP.
*Note: This strictly decouples the Form processor from knowing anything about Email providers.*

---

## Scalability and Reliability

*   **Plugin Crash Isolation:** Because gRPC extensions run in separate OS processes, a fatal panic inside a poorly written Extension will NOT take down the main CMS Kernel. The Plugin Mgr securely logs the failure and can attempt a restart.
*   **Zero-Allocation Paths:** Critical public-facing content reads are highly optimized. Routes and layout blocks utilize in-memory caching to avoid database roundtrips on heavy traffic spikes.
*   **Transaction Safety:** Complex core mutations use PostgreSQL transactions to ensure atomic commits, avoiding partial data states during errors.