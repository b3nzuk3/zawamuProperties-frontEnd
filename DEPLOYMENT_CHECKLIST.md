# Schedule Viewing Feature - Deployment Checklist

## Pre-Deployment Testing

### 1. Test Frontend Changes

- [ ] Verify existing property listings still display correctly
- [ ] Test "Schedule Viewing" buttons appear on all property cards
- [ ] Test modal opens and form validation works
- [ ] Test form submission (should show success/error messages)

### 2. Test Backend Changes

- [ ] Verify server starts without errors
- [ ] Test existing API endpoints still work
- [ ] Test new viewing-requests endpoint
- [ ] Verify database connection still works

### 3. Test Admin Interface

- [ ] Verify existing admin dashboard still works
- [ ] Test new "Viewing Requests" menu item
- [ ] Test viewing requests management interface

## Deployment Steps

### 1. Database Migration (Optional)

The new ViewingRequest model will be created automatically when first accessed.
No manual migration needed.

### 2. Environment Variables

No new environment variables required.

### 3. Dependencies

All dependencies were already present in your project.

## Rollback Plan (If Needed)

### Quick Rollback

If any issues arise, you can quickly remove:

1. Remove the new buttons from property components
2. Remove the new admin menu item
3. Remove the new route from App.tsx
4. The new API endpoints will simply return 404 (harmless)

### Files to Remove for Rollback:

- `src/components/ui/schedule-viewing-modal.tsx`
- `src/pages/AdminViewingRequests.tsx`
- `server/src/models/ViewingRequest.js`
- `server/src/controllers/viewingController.js`
- `server/src/routes/viewing.js`

## Post-Deployment Verification

### 1. Check Core Functionality

- [ ] Property listings load correctly
- [ ] Property details pages work
- [ ] Admin dashboard accessible
- [ ] Blog functionality works

### 2. Test New Feature

- [ ] Schedule viewing buttons visible
- [ ] Modal form works
- [ ] Admin can view requests
- [ ] Database stores requests correctly

## Risk Assessment: LOW

- All changes are additive
- No existing functionality modified
- Easy to rollback if needed
- New features are optional (users can still use site normally)
