import { Routes, Route, Navigate, useParams } from "react-router-dom";
import { SduiPage } from "@/components/sdui-page";
import { SduiDashboardPage } from "@/pages/sdui-dashboard";
import { SduiContentTypesPage } from "@/pages/sdui-content-types";
import { SduiTaxonomiesPage } from "@/pages/sdui-taxonomies";
import { SduiNodeListPage } from "@/pages/sdui-node-list";
import { SduiTaxonomyTermsPage } from "@/pages/sdui-taxonomy-terms";
import { SduiTemplatesPage } from "@/pages/sdui-templates";
import { SduiLayoutsPage } from "@/pages/sdui-layouts";
import { SduiBlockTypesPage } from "@/pages/sdui-block-types";
import { SduiLayoutBlocksPage } from "@/pages/sdui-layout-blocks";
import { SduiMenusPage } from "@/pages/sdui-menus";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { getNodeAccess, hasCapability } from "@/api/client";
import { SduiThemesPage } from "@/pages/sdui-themes";
import { SduiNodeEditorPage } from "@/pages/sdui-node-editor";
import { SduiExtensionsPage } from "@/pages/sdui-extensions";
import { SduiThemeFilesPage } from "@/pages/sdui-theme-files";
import { SduiExtensionFilesPage } from "@/pages/sdui-extension-files";
import { SduiNodeTypeEditorPage } from "@/pages/sdui-node-type-editor";
import { SduiBlockTypeEditorPage } from "@/pages/sdui-block-type-editor";
import { SduiTemplateEditorPage } from "@/pages/sdui-template-editor";
import { SduiLayoutEditorPage } from "@/pages/sdui-layout-editor";
import { SduiLayoutBlockEditorPage } from "@/pages/sdui-layout-block-editor";
import { SduiMenuEditorPage } from "@/pages/sdui-menu-editor";
import { SduiUserEditorPage } from "@/pages/sdui-user-editor";
import { SduiRoleEditorPage } from "@/pages/sdui-role-editor";
import { SduiTermEditorPage } from "@/pages/sdui-term-editor";
import { SduiTaxonomyEditorPage } from "@/pages/sdui-taxonomy-editor";
import { SduiSiteSettingsPage } from "@/pages/sdui-site-settings";
import { ThemeSettingsPage } from "@/pages/theme-settings";
import { SduiLanguagesPage } from "@/pages/sdui-languages";
import { SduiUsersPage } from "@/pages/sdui-users";
import { SduiRolesPage } from "@/pages/sdui-roles";
import { SduiMcpTokensPage } from "@/pages/sdui-mcp-tokens";
import { SduiSecuritySettingsPage } from "@/pages/sdui-security-settings";
import LoginPage, { ForgotPasswordPage, ResetPasswordPage } from "@/pages/login";
import { SduiAdminShell } from "@/sdui/admin-shell";
import { AdminLanguageProvider } from "@/hooks/use-admin-language";
import { ExtensionsProvider } from "@/hooks/use-extensions";
import { ExtensionPageLoader } from "@/components/extension-page-loader";
import { Loader2 } from "lucide-react";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-muted">
        <Loader2 className="h-10 w-10 animate-spin" style={{ color: "var(--accent)" }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  // Provide the admin-language context to every authenticated route so the
  // header switcher and the X-Admin-Language fetch wrapper share one source.
  return <AdminLanguageProvider>{children}</AdminLanguageProvider>;
}

function NodeAccessGuard({
  nodeType,
  children,
}: {
  nodeType: string;
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const access = getNodeAccess(user, nodeType);
  if (access.access === "none") {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return <>{children}</>;
}

/**
 * CapabilityGuard redirects authenticated users without the required
 * capability back to the dashboard. The server-side API gates still
 * 403 every call, but rendering the page chrome (sidebar, breadcrumbs,
 * empty list) only to fail on data fetch is poor UX and arguably a
 * minor information disclosure (page exists, page is named X).
 *
 * Usage: wrap inside ProtectedRoute so anonymous users still hit the
 * login flow first:
 *   <ProtectedRoute>
 *     <CapabilityGuard requires="manage_users">
 *       <SduiUsersPage />
 *     </CapabilityGuard>
 *   </ProtectedRoute>
 *
 * `requires` accepts a single capability or an array (any-of). For
 * "all-of" semantics nest two guards.
 */
function CapabilityGuard({
  requires,
  children,
}: {
  requires: string | string[];
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const required = Array.isArray(requires) ? requires : [requires];
  const allowed = required.some((cap) => hasCapability(user, cap));
  if (!allowed) {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return <>{children}</>;
}

function DynamicNodeList() {
  const { nodeType } = useParams<{ nodeType: string }>();
  const type = nodeType || "page";
  return (
    <NodeAccessGuard nodeType={type}>
      <SduiNodeListPage />
    </NodeAccessGuard>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/admin/login" element={<LoginPage />} />
      <Route path="/admin/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/admin/reset-password" element={<ResetPasswordPage />} />

      {/* Dashboard */}
      <Route path="/admin/dashboard" element={<ProtectedRoute><SduiDashboardPage /></ProtectedRoute>} />

      {/* Content lists */}
      <Route path="/admin/content/:nodeType" element={<ProtectedRoute><DynamicNodeList /></ProtectedRoute>} />
      <Route path="/admin/content/:nodeType/taxonomies/:taxonomy" element={<ProtectedRoute><SduiTaxonomyTermsPage /></ProtectedRoute>} />
      <Route path="/admin/pages" element={<ProtectedRoute><SduiNodeListPage nodeTypeOverride="page" /></ProtectedRoute>} />
      <Route path="/admin/posts" element={<ProtectedRoute><SduiNodeListPage nodeTypeOverride="post" /></ProtectedRoute>} />
      <Route path="/admin/templates" element={<ProtectedRoute><CapabilityGuard requires="manage_layouts"><SduiTemplatesPage /></CapabilityGuard></ProtectedRoute>} />
      <Route path="/admin/layouts" element={<ProtectedRoute><CapabilityGuard requires="manage_layouts"><SduiLayoutsPage /></CapabilityGuard></ProtectedRoute>} />
      <Route path="/admin/block-types" element={<ProtectedRoute><CapabilityGuard requires="manage_layouts"><SduiBlockTypesPage /></CapabilityGuard></ProtectedRoute>} />
      <Route path="/admin/layout-blocks" element={<ProtectedRoute><CapabilityGuard requires="manage_layouts"><SduiLayoutBlocksPage /></CapabilityGuard></ProtectedRoute>} />
      <Route path="/admin/menus" element={<ProtectedRoute><CapabilityGuard requires="manage_menus"><SduiMenusPage /></CapabilityGuard></ProtectedRoute>} />
      <Route path="/admin/themes" element={<ProtectedRoute><CapabilityGuard requires="manage_settings"><SduiThemesPage /></CapabilityGuard></ProtectedRoute>} />
      <Route path="/admin/extensions" element={<ProtectedRoute><CapabilityGuard requires="manage_settings"><SduiExtensionsPage /></CapabilityGuard></ProtectedRoute>} />

      {/* Node editor */}
      <Route path="/admin/pages/new" element={<ProtectedRoute><SduiNodeEditorPage nodeTypeProp="page" /></ProtectedRoute>} />
      <Route path="/admin/pages/:id/edit" element={<ProtectedRoute><SduiNodeEditorPage nodeTypeProp="page" /></ProtectedRoute>} />
      <Route path="/admin/posts/new" element={<ProtectedRoute><SduiNodeEditorPage nodeTypeProp="post" /></ProtectedRoute>} />
      <Route path="/admin/posts/:id/edit" element={<ProtectedRoute><SduiNodeEditorPage nodeTypeProp="post" /></ProtectedRoute>} />
      <Route path="/admin/content/:nodeType/new" element={<ProtectedRoute><SduiNodeEditorPage /></ProtectedRoute>} />
      <Route path="/admin/content/:nodeType/:id/edit" element={<ProtectedRoute><SduiNodeEditorPage /></ProtectedRoute>} />

      {/* Content type editors */}
      <Route path="/admin/content-types" element={<ProtectedRoute><CapabilityGuard requires="manage_settings"><SduiContentTypesPage /></CapabilityGuard></ProtectedRoute>} />
      <Route path="/admin/content-types/new" element={<ProtectedRoute><CapabilityGuard requires="manage_settings"><SduiNodeTypeEditorPage /></CapabilityGuard></ProtectedRoute>} />
      <Route path="/admin/content-types/:id/edit" element={<ProtectedRoute><CapabilityGuard requires="manage_settings"><SduiNodeTypeEditorPage /></CapabilityGuard></ProtectedRoute>} />

      {/* Block type editors */}
      <Route path="/admin/block-types/new" element={<ProtectedRoute><CapabilityGuard requires="manage_layouts"><SduiBlockTypeEditorPage /></CapabilityGuard></ProtectedRoute>} />
      <Route path="/admin/block-types/:id/edit" element={<ProtectedRoute><CapabilityGuard requires="manage_layouts"><SduiBlockTypeEditorPage /></CapabilityGuard></ProtectedRoute>} />

      {/* Template editors */}
      <Route path="/admin/templates/new" element={<ProtectedRoute><CapabilityGuard requires="manage_layouts"><SduiTemplateEditorPage /></CapabilityGuard></ProtectedRoute>} />
      <Route path="/admin/templates/:id/edit" element={<ProtectedRoute><CapabilityGuard requires="manage_layouts"><SduiTemplateEditorPage /></CapabilityGuard></ProtectedRoute>} />

      {/* Layout editors */}
      <Route path="/admin/layouts/new" element={<ProtectedRoute><CapabilityGuard requires="manage_layouts"><SduiLayoutEditorPage /></CapabilityGuard></ProtectedRoute>} />
      <Route path="/admin/layouts/:id" element={<ProtectedRoute><CapabilityGuard requires="manage_layouts"><SduiLayoutEditorPage /></CapabilityGuard></ProtectedRoute>} />

      {/* Layout block editors */}
      <Route path="/admin/layout-blocks/new" element={<ProtectedRoute><CapabilityGuard requires="manage_layouts"><SduiLayoutBlockEditorPage /></CapabilityGuard></ProtectedRoute>} />
      <Route path="/admin/layout-blocks/:id" element={<ProtectedRoute><CapabilityGuard requires="manage_layouts"><SduiLayoutBlockEditorPage /></CapabilityGuard></ProtectedRoute>} />
      <Route path="/admin/layout-blocks/:id/edit" element={<ProtectedRoute><CapabilityGuard requires="manage_layouts"><SduiLayoutBlockEditorPage /></CapabilityGuard></ProtectedRoute>} />

      {/* Menu editors */}
      <Route path="/admin/menus/new" element={<ProtectedRoute><CapabilityGuard requires="manage_menus"><SduiMenuEditorPage /></CapabilityGuard></ProtectedRoute>} />
      <Route path="/admin/menus/:id" element={<ProtectedRoute><CapabilityGuard requires="manage_menus"><SduiMenuEditorPage /></CapabilityGuard></ProtectedRoute>} />
      <Route path="/admin/menus/:id/edit" element={<ProtectedRoute><CapabilityGuard requires="manage_menus"><SduiMenuEditorPage /></CapabilityGuard></ProtectedRoute>} />

      {/* Taxonomy editors */}
      <Route path="/admin/taxonomies" element={<ProtectedRoute><CapabilityGuard requires="manage_settings"><SduiTaxonomiesPage /></CapabilityGuard></ProtectedRoute>} />
      <Route path="/admin/taxonomies/new" element={<ProtectedRoute><CapabilityGuard requires="manage_settings"><SduiTaxonomyEditorPage /></CapabilityGuard></ProtectedRoute>} />
      <Route path="/admin/taxonomies/:slug/edit" element={<ProtectedRoute><CapabilityGuard requires="manage_settings"><SduiTaxonomyEditorPage /></CapabilityGuard></ProtectedRoute>} />

      {/* Term editors */}
      <Route path="/admin/content/:nodeType/taxonomies/:taxonomy/new" element={<ProtectedRoute><SduiTermEditorPage /></ProtectedRoute>} />
      <Route path="/admin/content/:nodeType/taxonomies/:taxonomy/:id/edit" element={<ProtectedRoute><SduiTermEditorPage /></ProtectedRoute>} />

      {/* Site Settings — sub-pages share one shell component, parameterized
          by `section`. /admin/settings/site lands on General by redirect so
          deep links keep working. */}
      <Route path="/admin/settings/site" element={<Navigate to="/admin/settings/site/general" replace />} />
      <Route path="/admin/settings/site/general" element={<ProtectedRoute><CapabilityGuard requires="manage_settings"><SduiSiteSettingsPage section="general" /></CapabilityGuard></ProtectedRoute>} />
      <Route path="/admin/settings/site/seo" element={<ProtectedRoute><CapabilityGuard requires="manage_settings"><SduiSiteSettingsPage section="seo" /></CapabilityGuard></ProtectedRoute>} />
      <Route path="/admin/settings/site/robots" element={<ProtectedRoute><CapabilityGuard requires="manage_settings"><SduiSiteSettingsPage section="robots" /></CapabilityGuard></ProtectedRoute>} />
      <Route path="/admin/settings/site/advanced" element={<ProtectedRoute><CapabilityGuard requires="manage_settings"><SduiSiteSettingsPage section="advanced" /></CapabilityGuard></ProtectedRoute>} />
      <Route path="/admin/settings/site/languages" element={<ProtectedRoute><CapabilityGuard requires="manage_settings"><SduiLanguagesPage /></CapabilityGuard></ProtectedRoute>} />
      {/* Languages used to live at /admin/languages — keep the old path
          working as an alias so bookmarks and external links don't 404. */}
      <Route path="/admin/languages" element={<Navigate to="/admin/settings/site/languages" replace />} />

      {/* Security — Users / Roles / MCP Tokens. New /admin/security/*
          paths; legacy /admin/{users,roles,mcp-tokens} keep redirecting
          for muscle memory. */}
      <Route path="/admin/security" element={<Navigate to="/admin/security/users" replace />} />
      <Route path="/admin/security/users" element={<ProtectedRoute><CapabilityGuard requires="manage_users"><SduiUsersPage /></CapabilityGuard></ProtectedRoute>} />
      <Route path="/admin/security/users/new" element={<ProtectedRoute><CapabilityGuard requires="manage_users"><SduiUserEditorPage /></CapabilityGuard></ProtectedRoute>} />
      <Route path="/admin/security/users/:id/edit" element={<ProtectedRoute><CapabilityGuard requires="manage_users"><SduiUserEditorPage /></CapabilityGuard></ProtectedRoute>} />
      <Route path="/admin/security/roles" element={<ProtectedRoute><CapabilityGuard requires="manage_roles"><SduiRolesPage /></CapabilityGuard></ProtectedRoute>} />
      <Route path="/admin/security/roles/new" element={<ProtectedRoute><CapabilityGuard requires="manage_roles"><SduiRoleEditorPage /></CapabilityGuard></ProtectedRoute>} />
      <Route path="/admin/security/roles/:id/edit" element={<ProtectedRoute><CapabilityGuard requires="manage_roles"><SduiRoleEditorPage /></CapabilityGuard></ProtectedRoute>} />
      <Route path="/admin/security/mcp-tokens" element={<ProtectedRoute><CapabilityGuard requires="manage_settings"><SduiMcpTokensPage /></CapabilityGuard></ProtectedRoute>} />
      <Route path="/admin/security/settings" element={<ProtectedRoute><CapabilityGuard requires="manage_settings"><SduiSecuritySettingsPage /></CapabilityGuard></ProtectedRoute>} />
      <Route path="/admin/users" element={<Navigate to="/admin/security/users" replace />} />
      <Route path="/admin/users/new" element={<Navigate to="/admin/security/users/new" replace />} />
      <Route path="/admin/users/:id/edit" element={<ProtectedRoute><CapabilityGuard requires="manage_users"><SduiUserEditorPage /></CapabilityGuard></ProtectedRoute>} />
      <Route path="/admin/roles" element={<Navigate to="/admin/security/roles" replace />} />
      <Route path="/admin/roles/new" element={<Navigate to="/admin/security/roles/new" replace />} />
      <Route path="/admin/roles/:id/edit" element={<ProtectedRoute><CapabilityGuard requires="manage_roles"><SduiRoleEditorPage /></CapabilityGuard></ProtectedRoute>} />
      <Route path="/admin/mcp-tokens" element={<Navigate to="/admin/security/mcp-tokens" replace />} />

      {/* File viewers */}
      <Route path="/admin/themes/:id/files" element={<ProtectedRoute><SduiThemeFilesPage /></ProtectedRoute>} />
      <Route path="/admin/extensions/:slug/files" element={<ProtectedRoute><SduiExtensionFilesPage /></ProtectedRoute>} />

      {/* Extension pages */}
      <Route
        path="/admin/ext/:slug/*"
        element={
          <ProtectedRoute>
            <SduiAdminShell>
              <ExtensionPageLoader />
            </SduiAdminShell>
          </ProtectedRoute>
        }
      />

      {/* SDUI test route */}
      <Route path="/admin/sdui/:page" element={<ProtectedRoute><SduiAdminShell><SduiPage /></SduiAdminShell></ProtectedRoute>} />

      {/* Theme settings */}
      <Route path="/admin/theme-settings/:page" element={<ProtectedRoute><ThemeSettingsPage /></ProtectedRoute>} />

      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ExtensionsProvider>
        <AppRoutes />
      </ExtensionsProvider>
    </AuthProvider>
  );
}
