# Claude Code Instructions: Wizard Component Implementation

## File Structure
- **Template**: Copy from `/docs/ui-spikes/_template.html` 
- **Target**: Create in `/docs/ui-spikes/wizard/[filename].html`
- **Styles**: Use existing `/docs/ui-spikes/styles.css` classes
- **Reference**: Check `/docs/ui-spikes/style-source-mapping.md` for color codes

## Implementation Instructions

### 1. Base Setup
```html
<!-- Copy _template.html and modify these sections: -->
<title>SupportSignal Wizard - [Version Name]</title>
<h1 class="header-h1">Wizard Component - [Version Name]</h1>
```

### 2. Required Wizard Structure
Create a wizard with **exactly 4 steps**:

**Step 1: Basic Details**
- Participant name (required)
- Location (required) 
- Date/time picker

**Step 2: Incident Description**
- Multi-line textarea for narrative
- Optional file upload placeholder

**Step 3: Assessment**
- Severity radio buttons (Low/Medium/High)
- Contributing factors checkboxes

**Step 4: Review & Submit**
- Summary of entered data
- Final submit button

### 3. Visual Progress Requirements

#### Progress Bar (Required)
```html
<div class="mb-ss-lg">
    <div class="flex justify-between text-healthcare-sm text-gray-600 mb-ss-sm">
        <span>Step 2 of 4</span>
        <span>50% Complete</span>
    </div>
    <div class="ss-progress">
        <div class="ss-progress-bar" style="width: 50%"></div>
    </div>
</div>
```

#### Step Navigation (Required)
```html
<div class="flex items-center justify-center space-x-ss-sm mb-ss-lg">
    <!-- Step 1: Completed -->
    <div class="w-8 h-8 rounded-full bg-ss-success text-white flex items-center justify-center text-sm font-semibold">
        ✓
    </div>
    <div class="w-8 h-0.5 bg-ss-success"></div>
    
    <!-- Step 2: Current -->
    <div class="w-8 h-8 rounded-full bg-ss-teal text-white flex items-center justify-center text-sm font-semibold">
        2
    </div>
    <div class="w-8 h-0.5 bg-gray-300"></div>
    
    <!-- Step 3: Upcoming -->
    <div class="w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center text-sm font-semibold">
        3
    </div>
    <!-- etc -->
</div>
```

### 4. Form Elements (Use These Exact Classes)

#### Text Input
```html
<div class="mb-ss-md">
    <label class="block healthcare-sm font-medium text-healthcare-primary mb-2">
        Participant Name *
    </label>
    <input type="text" class="ss-input" placeholder="Enter participant name" required>
</div>
```

#### Textarea
```html
<div class="mb-ss-md">
    <label class="block healthcare-sm font-medium text-healthcare-primary mb-2">
        Incident Description *
    </label>
    <textarea class="ss-input" rows="4" placeholder="Describe what happened..."></textarea>
</div>
```

#### Radio Buttons
```html
<div class="mb-ss-md">
    <label class="block healthcare-sm font-medium text-healthcare-primary mb-2">Severity Level</label>
    <div class="space-y-ss-sm">
        <label class="flex items-center">
            <input type="radio" name="severity" value="low" class="mr-2">
            <span>Low - Minor incident</span>
        </label>
        <!-- Add Medium and High options -->
    </div>
</div>
```

### 5. Action Buttons (Required Pattern)
```html
<div class="flex justify-between mt-ss-xl">
    <button class="ss-btn ss-btn-outline" id="prevBtn">
        Previous
    </button>
    <button class="ss-btn ss-btn-primary" id="nextBtn">
        Next Step
    </button>
</div>
```

### 6. JavaScript Requirements (Minimal)
Include this basic step navigation:

```javascript
<script>
let currentStep = 1;
const totalSteps = 4;

function showStep(step) {
    // Hide all steps
    document.querySelectorAll('[data-step]').forEach(el => {
        el.style.display = 'none';
    });
    
    // Show current step
    document.querySelector(`[data-step="${step}"]`).style.display = 'block';
    
    // Update progress bar
    const progress = (step / totalSteps) * 100;
    document.querySelector('.ss-progress-bar').style.width = progress + '%';
    
    // Update step counter
    document.querySelector('.step-counter').textContent = `Step ${step} of ${totalSteps}`;
}

document.getElementById('nextBtn').onclick = () => {
    if (currentStep < totalSteps) {
        currentStep++;
        showStep(currentStep);
    }
};

document.getElementById('prevBtn').onclick = () => {
    if (currentStep > 1) {
        currentStep--;
        showStep(currentStep);
    }
};
</script>
```

### 7. Responsive Requirements
- Use `ss-grid ss-grid-2` for desktop, collapses to single column on mobile
- Buttons should be full-width on mobile screens
- Progress indicators should remain visible at all screen sizes

### 8. Content Variations by Version

**version-01-basic.html**: Minimal wizard with simple styling
**version-02-minimal.html**: Mobile-optimized, fewer visual elements  
**version-03-cards.html**: Each step in a card, more visual hierarchy

## Testing Checklist
- [ ] All 4 steps navigate correctly
- [ ] Progress bar updates on step change
- [ ] Form validation shows on required fields
- [ ] Responsive on mobile (375px width)
- [ ] Uses only SupportSignal color classes
- [ ] Previous/Next buttons work correctly

## File References
- **Colors**: Use `ss-teal`, `ss-navy`, `ss-success`, `healthcare-primary`
- **Spacing**: Use `ss-xs`, `ss-sm`, `ss-md`, `ss-lg`, `ss-xl` classes
- **Typography**: Use `healthcare-sm`, `healthcare-base`, `header-h3` classes
- **Components**: Use `ss-btn`, `ss-input`, `ss-progress`, `healthcare-card` classes

---
**Target Usage**: `claude: "Read claude-code-instructions.md and create version-01-basic.html"`