# VibeCMS API Specification

## About This Document

**Purpose:** REST endpoint contracts for frontend and external consumers. Defines the interface between backend services and clients.

**Consistency requirements:** Every endpoint corresponds to the active Fiber handlers in the `internal/cms` and `internal/auth` packages. This document reflects the full 1.0 architecture including Themes, Layouts, Languages, and Menus.

The API uses two distinct authentication models:
1.  **Session-Based:** Used by the Admin UI (`/admin/api/*`). Requires an active session cookie managed via the `/auth` endpoints.
2.  **Bearer Token:** Used by the Monitoring API (`/api/v1/*`). Requires a static token.

---

## Authentication & Users

### Auth Handlers (`/auth`)
- **`POST /auth/login`**: Authenticates a user and establishes a session.
- **`POST /auth/logout`**: Terminates the current session.
- **`GET  /me`**: Retrieve the profile of the currently authenticated user.

### User Management (`/users`)
- **`GET    /users`**: List all administrative users with pagination.
- **`GET    /users/:id`**: Retrieve details for a specific user.
- **`POST   /users`**: Create a new administrative user.
- **`PATCH  /users/:id`**: Update user details or role.
- **`DELETE /users/:id`**: Remove a user account.

---

## Content Management

### Content Nodes (`/nodes`)
- **`GET    /nodes`**: List all content nodes with filtering.
- **`GET    /nodes/search`**: Text search across node titles and slugs.
- **`GET    /nodes/:id`**: Retrieve a complete content node.
- **`POST   /nodes`**: Create a new content node.
- **`PATCH  /nodes/:id`**: Update content, status, or SEO settings.
- **`DELETE /nodes/:id`**: Soft-delete a content node.
- **`GET    /nodes/:id/translations`**: Get localized versions of a node.
- **`POST   /nodes/:id/translations`**: Create a translation for a node.
- **`POST   /nodes/:id/homepage`**: Set a node as the primary homepage.
- **`GET    /homepage`**: Retrieve the active homepage.

### Node Types (`/node-types`)
- **`GET    /node-types`**: List all custom content schemas.
- **`GET    /node-types/:id`**: Fetch specific node type.
- **`POST   /node-types`**: Create a new node type representation.
- **`PATCH  /node-types/:id`**: Update the schema for a node type.
- **`DELETE /node-types/:id`**: Delete a custom schema.

---

## Blocks, Layouts, & Templates

### Block Types (`/block-types`)
- **`GET    /block-types`**: List all registered reusable blocks.
- **`GET    /block-types/:id`**: Get specific block schema.
- **`POST   /block-types`**: Register a new block schema.
- **`POST   /block-types/preview`**: Preview templated block content.
- **`PATCH  /block-types/:id`**: Update block properties.
- **`DELETE /block-types/:id`**: Delete a block.

### Layouts (`/layouts`)
- **`GET    /layouts`**: List all page layouts.
- **`GET    /layouts/:id`**: Get a specific layout definition.
- **`POST   /layouts`**: Create a new layout.
- **`PATCH  /layouts/:id`**: Update a layout.
- **`DELETE /layouts/:id`**: Delete a layout.

### Layout Blocks (`/layout-blocks`)
- **`GET    /layout-blocks`**: List individual block instances within layouts.
- **`POST   /layout-blocks`**: Attach a block to a layout region.
- **`PATCH  /layout-blocks/:id`**: Update settings of an instantiated block.
- **`DELETE /layout-blocks/:id`**: Remove a block instance.

### Templates (`/templates`)
- **`GET    /templates`**: List pre-configured block arrangements.
- **`GET    /templates/:id`**: Get a template.
- **`POST   /templates`**: Create a template.
- **`PATCH  /templates/:id`**: Update a template.
- **`DELETE /templates/:id`**: Delete a template.

---

## Global Site Settings

### Media Manager (`/media`)
- **`GET    /media`**: List uploaded assets.
- **`GET    /media/:id`**: Retrieve asset metadata.
- **`POST   /media/upload`**: Upload a new file binary.
- **`PUT    /media/:id`**: Update asset metadata constraints.
- **`DELETE /media/:id`**: Permanently delete an asset.

### Menus (`/menus`)
- **`GET    /menus`**: List all navigation menus.
- **`GET    /menus/:id`**: Retrieve a menu and its tree.
- **`POST   /menus`**: Create a new menu.
- **`PATCH  /menus/:id`**: Update a menu's metadata.
- **`DELETE /menus/:id`**: Delete a menu tree.
- **`PUT    /menus/:id/items`**: Bulk replace the entire JSON node tree of the menu.

### Languages (`/languages`)
- **`GET    /languages`**: List multi-lingual locale setups.
- **`GET    /languages/:id`**: Retrieve specific localized environment.
- **`POST   /languages`**: Register a new site language.
- **`PATCH  /languages/:id`**: Toggle active/default mapping.
- **`DELETE /languages/:id`**: Deprecate a language.

---

## Extensions & Themes

### Extensions (`/extensions`)
- **`GET    /extensions/manifests`**: Scan filesystem for available `.json` extension manifests.
- **`GET    /extensions`**: List activated extensions mapped to DB records.
- **`GET    /extensions/:slug`**: Get exact configuration of an extension.
- **`POST   /extensions/:slug/activate`**: Boot and mount an extension (plugin/Tengo).
- **`POST   /extensions/:slug/deactivate`**: Unmount an extension.
- **`DELETE /extensions/:slug`**: Uninstall an extension.
- **`GET    /extensions/:slug/settings`**: Key-value extension settings read.
- **`PUT    /extensions/:slug/settings`**: Update configuration mapping.

### Themes (`/themes`)
- **`GET    /themes`**: List installed themes.
- **`GET    /themes/:id`**: Get detailed theme status.
- **`GET    /themes/:slug/check`**: Ping git remote to check for theme updates.
- **`POST   /themes/upload`**: Manually push a `.zip` theme.
- **`PATCH  /themes/:id`**: Edit theme descriptors.
- **`DELETE /themes/:id`**: Trash a theme and its static assets.
- **`POST   /themes/:id/git-config`**: Configure automated Git sync for the theme.
- **`POST   /api/v1/theme-deploy`**: Generic webhook hook for Github/Gitlab Push trigger.

---

## System Statistics & Monitoring

### Ext API (`/api/v1`)
- **`GET /api/v1/stats`**: Detailed telemetry for external dashboards.
- **`GET /api/v1/health`**: Simple liveness check for load balancers.

---

## Error Response Format
All non-2xx responses follow a standard envelope.

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "The provided slug is already in use by another node.",
    "fields": {
      "slug": "must be unique"
    }
  }
}
```