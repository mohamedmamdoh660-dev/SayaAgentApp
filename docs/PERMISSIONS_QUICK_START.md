# Permissions Quick Start Guide

## 🚀 Getting Started with the New Permission System

### For Administrators

#### 1. Access the Permissions Page

Navigate to **Settings → Permissions** (or `/permissions` in your URL)

#### 2. Choose Your View

- **Matrix View** (Recommended): Visual grid for bulk permission management
- **List View**: Traditional table for individual permission records

#### 3. Manage Permissions Using Matrix View

**Step 1**: Select a role from the dropdown

```
Example: Select "Agent" role
```

**Step 2**: Set permissions by checking/unchecking boxes

- Each row = a resource (Students, Applications, etc.)
- Each column = an action (Create, Read, Edit, Delete)

**Step 3**: Use bulk actions for efficiency

- **Select All Create**: Grant create permission for all resources
- **Give all permissions**: Grant all actions for a specific resource

**Step 4**: Save your changes

- Click "Save Changes" button
- Changes apply immediately

### For Developers

#### Quick Implementation Examples

##### 1. Hide UI Element Based on Permission

```tsx
import { CreateProtected } from "@/components/auth/permission-protected";
import { ResourceType } from "@/types/types";

// Only show create button if user has permission
<CreateProtected resource={ResourceType.STUDENTS}>
  <Button>Create New Student</Button>
</CreateProtected>;
```

##### 2. Check Permission Programmatically

```tsx
import { usePermission } from "@/components/auth/permission-protected";
import { ResourceType } from "@/types/types";

function MyComponent() {
  const { canEdit, canDelete } = usePermission();

  const showEditButton = canEdit(ResourceType.APPLICATIONS);
  const showDeleteButton = canDelete(ResourceType.APPLICATIONS);

  return (
    <>
      {showEditButton && <Button>Edit</Button>}
      {showDeleteButton && <Button>Delete</Button>}
    </>
  );
}
```

##### 3. Server-Side Permission Check

```tsx
import { canCreate } from "@/lib/permissions";
import { ResourceType } from "@/types/types";

export async function createStudent(userData, studentData) {
  // Check permission before processing
  if (!canCreate(userData, ResourceType.STUDENTS)) {
    return { error: "You don't have permission to create students" };
  }

  // Proceed with creation
  const student = await db.students.create(studentData);
  return { success: true, student };
}
```

## 📋 Common Use Cases

### Use Case 1: Create a Read-Only Role

1. Go to Roles page → Create new role "Viewer"
2. Go to Permissions page → Matrix View
3. Select "Viewer" role
4. Click "Select All Read" at the top
5. Click "Save Changes"

Result: Users with "Viewer" role can see all data but cannot create, edit, or delete.

### Use Case 2: Create a Data Entry Role

1. Create role "Data Entry Clerk"
2. In Matrix View:
   - Check: Students → Create, Read, Edit
   - Check: Applications → Create, Read, Edit
   - Uncheck: All Delete permissions
3. Save changes

Result: Users can add and edit students/applications but cannot delete.

### Use Case 3: Restrict Access to Sensitive Modules

1. Select existing role
2. In Matrix View:
   - Uncheck: Settings → all actions
   - Uncheck: Reports → all actions
   - Uncheck: Users → all actions
3. Save changes

Result: Role cannot access admin features.

## 🎯 Best Practices

### ✅ DO:

- Start with minimal permissions and add as needed
- Test new roles with a test account before assigning to real users
- Use descriptive role names (e.g., "Admission Officer" not "Role1")
- Document why certain permissions were granted
- Regularly review and update permissions

### ❌ DON'T:

- Grant all permissions unless absolutely necessary
- Forget to test permission changes
- Share admin credentials
- Skip server-side permission checks
- Modify permissions in production without testing first

## 🔧 Troubleshooting

### Problem: User can't see a page

**Solution**: Grant READ or VIEW permission for that resource

### Problem: User can see but can't edit

**Solution**: Grant EDIT permission for that resource

### Problem: Changes not reflecting

**Solution**: User needs to logout and login again

### Problem: Button/feature still hidden after granting permission

**Solution**:

1. Verify permission was saved (check in List View)
2. User should logout/login
3. Check if there are additional business logic restrictions

## 📚 Resource Reference

### Available Resources

```
Core:
  - dashboard
  - search

User Management:
  - users
  - roles
  - permissions

Student & Application:
  - students
  - applications

Academic:
  - universities
  - programs
  - countries
  - cities
  - degrees
  - faculties
  - specialities
  - languages
  - academic_years
  - semesters

Communication:
  - announcements
  - knowledge_base

System:
  - settings
  - reports
```

### Available Actions

```
- create   → Can create new records
- read     → Can view lists and search
- edit     → Can update existing records
- delete   → Can remove records
- view     → Can view detailed information
- export   → Can export data
- generate → Can generate reports/documents
```

## 🚦 Quick Permission Matrix Examples

### Admin Role (Full Access)

| Resource     | Create | Read | Edit | Delete |
| ------------ | ------ | ---- | ---- | ------ |
| Students     | ✅     | ✅   | ✅   | ✅     |
| Applications | ✅     | ✅   | ✅   | ✅     |
| Universities | ✅     | ✅   | ✅   | ✅     |
| Settings     | ✅     | ✅   | ✅   | ✅     |

### Agent Role (Limited)

| Resource     | Create | Read | Edit | Delete |
| ------------ | ------ | ---- | ---- | ------ |
| Students     | ✅     | ✅   | ✅   | ❌     |
| Applications | ✅     | ✅   | ✅   | ❌     |
| Universities | ❌     | ✅   | ❌   | ❌     |
| Settings     | ❌     | ❌   | ❌   | ❌     |

### Viewer Role (Read-Only)

| Resource     | Create | Read | Edit | Delete |
| ------------ | ------ | ---- | ---- | ------ |
| Students     | ❌     | ✅   | ❌   | ❌     |
| Applications | ❌     | ✅   | ❌   | ❌     |
| Universities | ❌     | ✅   | ❌   | ❌     |
| Reports      | ❌     | ✅   | ❌   | ❌     |

## 📞 Need Help?

1. Check the full guide: `docs/PERMISSIONS_GUIDE.md`
2. Review implementation details: `docs/PERMISSIONS_IMPLEMENTATION_SUMMARY.md`
3. Examine the code examples in this guide
4. Test with a dedicated test user account
5. Contact your system administrator

## 🎉 You're Ready!

The new permission system gives you powerful control over who can do what in your application. Start by:

1. **Creating roles** that match your organization structure
2. **Setting permissions** using the matrix view
3. **Assigning roles** to users
4. **Testing** with test accounts
5. **Monitoring** and adjusting as needed

Happy permission managing! 🔒

