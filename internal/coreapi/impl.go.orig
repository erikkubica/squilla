package coreapi

import (
	"squilla/internal/cms"
	"squilla/internal/events"
	"squilla/internal/secrets"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// coreImpl implements the CoreAPI interface, delegating to existing services.
// Remaining methods are provided in other impl_*.go files.
//
// Two former feature-specific fields (*email.Dispatcher and *cms.MediaService)
// have been removed per the kernel/extensions hard rule. Email dispatch
// runs entirely in the email-manager extension; media operations route
// through whichever extension declares provides:["media-provider"] via
// the MediaProviderResolver below.
type coreImpl struct {
	db            *gorm.DB
	eventBus      *events.EventBus
	contentSvc    *cms.ContentService
	menuSvc       *cms.MenuService
	mediaResolver MediaProviderResolver
	nodeTypeSvc   *cms.NodeTypeService
	app           *fiber.App
	secrets       *secrets.Service // may be nil (encryption disabled in dev)
	filters       map[string][]filterEntry
	nextFilterID  uint64 // monotonically increasing — assigned to each filterEntry as a stable handle for Unsubscribe.
}

type filterEntry struct {
	id       uint64 // opaque registration handle — used by the returned UnsubscribeFunc to locate this entry.
	priority int
	handler  FilterHandler
}

// NewCoreImpl constructs a CoreAPI backed by the given services. Pass a
// non-nil *secrets.Service to enable transparent at-rest encryption for
// secret-shaped settings; nil leaves reads/writes plaintext (dev/test).
//
// mediaResolver may be nil — CoreAPI media methods then surface a clear
// "no media provider configured" error. Tests that don't exercise media
// use that nil-safe path; production main wires it from the plugin
// manager via cms.NewMediaProviderResolver.
func NewCoreImpl(
	db *gorm.DB,
	eventBus *events.EventBus,
	contentSvc *cms.ContentService,
	menuSvc *cms.MenuService,
	mediaResolver MediaProviderResolver,
	nodeTypeSvc *cms.NodeTypeService,
	app *fiber.App,
	secretsSvc *secrets.Service,
) CoreAPI {
	return &coreImpl{
		db:            db,
		eventBus:      eventBus,
		contentSvc:    contentSvc,
		menuSvc:       menuSvc,
		mediaResolver: mediaResolver,
		nodeTypeSvc:   nodeTypeSvc,
		app:           app,
		secrets:       secretsSvc,
		filters:       make(map[string][]filterEntry),
	}
}

// Compile-time interface satisfaction check.
var _ CoreAPI = (*coreImpl)(nil)
