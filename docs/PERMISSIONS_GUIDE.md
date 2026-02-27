# Permissions & Role-Based Access Control (RBAC) Guide

## Overview

This application uses a comprehensive Role-Based Access Control (RBAC) system that allows fine-grained permission management. Administrators can control what users can do within the application based on their assigned roles.

## Key Concepts

### Roles

- **Roles** are groups that define what a user can do
- Examples: Admin, Agent, Sub Agent, Manager, etc.
- Each user is assigned one role
- Roles can be created, edited, and deleted through the Roles management page

### Resources

- **Resources** represent different modules/features in the application
- Examples: Students, Applications, Universities, Programs, Settings, etc.
- Full list available in `types/types.ts` under `ResourceType` enum

### Actions

- **Actions** define what can be done with a resource
- Standard CRUD operations:
  - `CREATE` - Create new records
  - `READ` - View/list records
  - `EDIT` - Update existing records
  - `DELETE` - Remove records
  - `VIEW` - View detailed information
  - `EXPORT` - Export data
  - `GENERATE` - Generate reports/documents

### Permissions

- **Permissions** are combinations of Role + Resource + Action
- Example: "Agent role can READ students" or "Manager role can EDIT applications"

## Managing Permissions

### Matrix View (Recommended)

The matrix view provides a visual grid where you can:

1. Select a role from the dropdown
2. See all resources in organized categories
3. Check/uncheck permissions for each action (Create, Read, Edit, Delete)
4. Bulk actions:
   - **Select All [Action]** - Grant all resources for a specific action
   - **Deselect All [Action]** - Remove all permissions for a specific action
   - **Give all permissions** - Grant all actions for a specific resource

### List View

The traditional list view shows permissions as individual records with filters for:

- Role
- Resource
- Action

## Using Permissions in Code

### Client-Side (React Components)

#### 1. Protecting UI Elements

```tsx
import { CreateProtected, EditProtected, DeleteProtected } from "@/components/auth/permission-protected";
import { ResourceType } from "@/types/types";

// Hide create button if user doesn't have create permission
<CreateProtected resource={ResourceType.STUDENTS}>
  <Button>Create Student</Button>
</CreateProtected>

// Hide edit action
<EditProtected resource={ResourceType.APPLICATIONS}>
  <DropdownMenuItem>Edit</DropdownMenuItem>
</EditProtected>

// Hide delete action
<DeleteProtected resource={ResourceType.UNIVERSITIES}>
  <Button variant="destructive">Delete</Button>
</DeleteProtected>
```

#### 2. Using Permission Hook

```tsx
import { usePermission } from "@/components/auth/permission-protected";
import { ResourceType, ActionType } from "@/types/types";

function MyComponent() {
  const { hasPermission, canCreate, canEdit } = usePermission();

  // Check specific permission
  if (hasPermission(ResourceType.STUDENTS, ActionType.CREATE)) {
    // Show create button
  }

  // Use helper methods
  if (canEdit(ResourceType.APPLICATIONS)) {
    // Enable edit mode
  }

  return <>{canCreate(ResourceType.STUDENTS) && <CreateButton />}</>;
}
```

### Server-Side (API Routes & Server Actions)

```tsx
import { hasPermission, canCreate, canEdit } from "@/lib/permissions";
import { ResourceType, ActionType } from "@/types/types";

export async function createStudent(userData: UserData, studentData: any) {
  // Check permission
  if (!canCreate(userData, ResourceType.STUDENTS)) {
    throw new Error("Permission denied");
  }

  // Proceed with creation
  // ...
}

export async function updateApplication(
  userData: UserData,
  id: string,
  data: any
) {
  // Check permission
  if (!hasPermission(userData, ResourceType.APPLICATIONS, ActionType.EDIT)) {
    return { error: "You don't have permission to edit applications" };
  }

  // Proceed with update
  // ...
}
```

## Available Resources

### Core

- `DASHBOARD` - Dashboard access
- `SEARCH` - Search functionality

### User Management

- `USERS` - User management
- `ROLES` - Role management
- `PERMISSIONS` - Permission management

### Student & Application Management

- `STUDENTS` - Student records
- `APPLICATIONS` - Application records

### Academic Resources

- `UNIVERSITIES` - University management
- `PROGRAMS` - Program management
- `COUNTRIES` - Country management
- `CITIES` - City management
- `DEGREES` - Degree management
- `FACULTIES` - Faculty management
- `SPECIALITIES` - Speciality management
- `LANGUAGES` - Language management

### Academic Settings

- `ACADEMIC_YEARS` - Academic year settings
- `SEMESTERS` - Semester settings

### Communication & Content

- `ANNOUNCEMENTS` - Announcement management
- `KNOWLEDGE_BASE` - Knowledge base articles

### System

- `SETTINGS` - System settings
- `REPORTS` - Report access

## Best Practices

### 1. Principle of Least Privilege

- Grant only the permissions necessary for a role to perform its duties
- Start with minimal permissions and add more as needed

### 2. Use Resource-Specific Roles

- Create roles for specific job functions (e.g., "Admission Officer", "Finance Manager")
- Avoid creating overly broad roles

### 3. Regular Audits

- Periodically review role permissions
- Remove unused permissions
- Update permissions when job responsibilities change

### 4. Test Permissions

- Always test new roles in a safe environment
- Verify that users can access what they need
- Ensure sensitive operations are properly restricted

### 5. Document Custom Roles

- Keep track of why certain permissions were granted
- Document the purpose of each custom role

## Common Permission Patterns

### Read-Only User

```
Resources: All needed modules
Actions: READ, VIEW only
```

### Data Entry Clerk

```
Resources: Students, Applications
Actions: CREATE, READ, EDIT
```

### Manager

```
Resources: Students, Applications, Reports
Actions: CREATE, READ, EDIT, DELETE, VIEW, EXPORT
```

### Administrator

```
Resources: All
Actions: All
```

## Troubleshooting

### User Can't See a Module

1. Check if they have READ or VIEW permission for that resource
2. Verify their role assignment
3. Check if the resource is enabled in settings

### User Can See But Can't Edit

1. Verify they have EDIT permission for that resource
2. Check if there are additional business logic restrictions

### Permission Changes Not Reflecting

1. User may need to log out and log back in
2. Clear browser cache
3. Verify the permissions were saved correctly

## Database Schema

### roles table

```sql
- id (UUID)
- name (String)
- description (String)
- created_at (Timestamp)
- updated_at (Timestamp)
```

### role_access table

```sql
- id (UUID)
- role_id (UUID) -> Foreign key to roles
- resource (String) -> ResourceType enum value
- action (String) -> ActionType enum value
- created_at (Timestamp)
- updated_at (Timestamp)
```

### user_profile table

```sql
- id (UUID)
- role_id (UUID) -> Foreign key to roles
- ... other user fields
```

## API Reference

### Client-Side Hooks

#### `usePermission()`

Returns permission checking functions:

- `hasPermission(resource, action)` - Check specific permission
- `canCreate(resource)` - Check create permission
- `canRead(resource)` - Check read permission
- `canEdit(resource)` - Check edit permission
- `canDelete(resource)` - Check delete permission
- `canView(resource)` - Check view permission

### Server-Side Functions

#### `hasPermission(userData, resource, action)`

Check if user has a specific permission

#### `canAccessModule(userData, resource)`

Check if user can access a module (READ or VIEW permission)

#### `canCreate(userData, resource)`

Check create permission

#### `canEdit(userData, resource)`

Check edit permission

#### `canDelete(userData, resource)`

Check delete permission

#### `getUserPermissions(userData)`

Get all permissions for a user

## Migration Guide

If you're upgrading from an older permission system:

1. **Backup your data** before making changes
2. **Map old permissions** to new ResourceType/ActionType enums
3. **Update role_access** records to use new enum values
4. **Update code** to use new permission components and hooks
5. **Test thoroughly** before deploying to production

## Security Considerations

1. **Never trust client-side** permission checks alone
2. **Always validate permissions** on the server
3. **Log permission changes** for audit trails
4. **Use HTTPS** to protect permission data in transit
5. **Regularly update** user roles when responsibilities change
6. **Implement rate limiting** on permission-sensitive operations

## Support

For questions or issues with the permission system:

1. Check this documentation first
2. Review existing roles and permissions in the Matrix View
3. Test with a dedicated test user account
4. Contact your system administrator for role assignment issues

