# GasConnect Backend – Routes and Controllers Refactor

This version separates the original route-handler logic into nine controller files. The refactor is based on the supplied backend source ZIP.

## Folder structure

- `routes/` contains endpoint definitions and route-level middleware.
- `controllers/` contains the original request-handler/business logic.
- `models/` contains Mongoose schemas and models.
- `middleware/` contains authentication and upload middleware.
- `utils/` contains reusable utilities such as email and invoice generation.
- `config/` contains service configuration.

## Route-to-controller mapping

| Route file | Controller file |
|---|---|
| `routes/userRoutes.js` | `controllers/userController.js` |
| `routes/bookingRoutes.js` | `controllers/bookingController.js` |
| `routes/productRoutes.js` | `controllers/productController.js` |
| `routes/orderRoutes.js` | `controllers/orderController.js` |
| `routes/reviewRoutes.js` | `controllers/reviewController.js` |
| `routes/repairRoutes.js` | `controllers/repairController.js` |
| `routes/serviceRoutes.js` | `controllers/serviceController.js` |
| `routes/serviceCategoryRoutes.js` | `controllers/serviceCategoryController.js` |
| `routes/chatbotRoutes.js` | `controllers/chatbotController.js` |

## Setup

1. Extract this folder.
2. Open it in VS Code.
3. Run `npm install` in this folder.
4. Copy `.env.example` to `.env`.
5. Fill `.env` with your own MongoDB, JWT, SMTP, Cloudinary and Google OAuth values. Do not commit `.env` to GitHub.
6. Run `npm start`.

## Refactor notes

- All nine route modules now import handlers from their matching controller modules.
- Existing route paths, HTTP methods, and route-level middleware registrations were preserved from the supplied source.
- The existing `server.js`, models, middleware, utilities, and package dependencies were retained.
- `orderController.js` exports `adminOnly` because it is used as route-level middleware in `orderRoutes.js`.
- Upload middleware remains in the route files; upload handling and business logic remain in the appropriate controller where applicable.
- No frontend API URLs need to change because the route paths and server route prefixes were preserved.

## Verification performed

- `node --check` passed for all JavaScript files.
- All nine route modules imported successfully in a local module-load check.
- Compared the original and refactored route declarations: all 73 route methods, paths, and middleware argument lists were preserved.

These checks validate syntax, module imports, and route wiring. They are not a substitute for testing the application against your own MongoDB, SMTP, Cloudinary, and Google OAuth credentials. Test in this extracted folder before replacing your existing working backend.
