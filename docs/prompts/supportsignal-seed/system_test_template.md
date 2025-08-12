# SupportSignal: System Test Template

**Source**: SupportSignal application seed template
**File**: `apps/convex/lib/prompts/default_prompts.ts`
**Category**: `general`
**Purpose**: Simple template for testing prompt management system functionality

## Template Configuration

```typescript
{
  name: "system_test_template",
  description: "Simple template for testing prompt management system functionality",
  category: "general" as const,
}
```

## Input Variables

- `user_name` - Name of the user running the test (string, required)
- `test_value` - Test value for system validation (number, required)
- `optional_param` - Optional parameter with default (string, optional, default: "Default test message")

## Prompt Template

```
This is a test template for the prompt management system.

**User**: {{user_name}}
**Test Parameter**: {{test_value}}
**Optional Setting**: {{optional_param}}

This template is used to verify that the prompt management system can:
- Substitute required variables correctly
- Handle optional variables with defaults
- Process different variable types

Current test value is: {{test_value}}
User {{user_name}} is testing the system.
{{optional_param}}
```

## Key Features

### **System Validation**
- **Variable substitution**: Tests required parameter replacement
- **Optional parameter handling**: Validates default value functionality
- **Type validation**: Tests string and number variable types
- **Template processing**: Verifies prompt resolution engine

### **Testing Capabilities**
- **Admin interface testing**: Validates template management UI
- **Backend function testing**: Confirms Convex function operations
- **Permission testing**: Verifies system admin access controls
- **Data validation**: Tests template storage and retrieval

## Use Cases

### **Development Testing**
- **Template system validation**: Confirm prompt management works correctly
- **Variable interpolation testing**: Verify {{variable}} replacement
- **Permission system testing**: Validate admin access controls
- **UI component testing**: Test template creation/editing interfaces

### **Production Monitoring**
- **System health checks**: Validate prompt system functionality
- **Template integrity**: Confirm templates resolve correctly
- **Access control verification**: Test permission requirements
- **Performance monitoring**: Measure template resolution speed

## Template Structure

### **Required Variables**
- `user_name` (string): Identifies test executor
- `test_value` (number): Validates numeric parameter handling

### **Optional Variables**
- `optional_param` (string): Tests default value functionality
- Default: "Default test message"

## Expected Output

```
This is a test template for the prompt management system.

**User**: John Doe
**Test Parameter**: 42
**Optional Setting**: Default test message

This template is used to verify that the prompt management system can:
- Substitute required variables correctly
- Handle optional variables with defaults
- Process different variable types

Current test value is: 42
User John Doe is testing the system.
Default test message
```

## Validation Points

1. **Variable Substitution**: All `{{variable}}` patterns replaced correctly
2. **Type Handling**: String and number variables processed appropriately
3. **Default Values**: Optional parameters use defaults when not provided
4. **Template Integrity**: Output matches expected format and content
5. **Error Handling**: System gracefully handles missing required variables

## Not Present in NDIS Original

This template is unique to the SupportSignal system and represents an administrative/testing capability not found in the original NDIS application. It demonstrates the enhanced management capabilities of the SupportSignal template system.