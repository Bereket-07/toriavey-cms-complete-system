# Caption Selection Guide

Learn how to select alternative captions from generated content.

---

## 🎯 Overview

When you generate social media content, the AI provides:
- **1 Main Caption** - The primary suggested caption
- **2+ Alternative Captions** - Different variations you can choose from

You can easily switch between these captions using the caption selection feature.

---

## 📝 How It Works

### Step 1: Generate Content

First, generate content as usual:

```bash
curl -X POST "http://localhost:8000/api/content/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "recipe_data": {
      "title": "Classic Chocolate Chip Cookies",
      "description": "The best cookies ever!",
      "ingredients": ["flour", "butter", "chocolate chips"],
      "instructions": ["Mix", "Bake", "Enjoy"]
    },
    "target_platforms": ["instagram"],
    "tone": "warm and inviting",
    "include_emojis": true,
    "max_hashtags": 10
  }'
```

### Step 2: Review Generated Captions

You'll receive a response like this:

```json
{
  "generated_contents": [
    {
      "platform": "instagram",
      "caption": "Cookie craving? 🍪 Satisfy it with these Classic Chocolate Chip Cookies!",
      "hashtags": ["cookies", "baking", "dessert"],
      "alternative_captions": [
        "The BEST chocolate chip cookie recipe you'll ever need! 🍪",
        "Happiness is a warm chocolate chip cookie. 😊"
      ],
      "selected_caption_index": 0
    }
  ]
}
```

**Caption Options:**
- **Index 0** (Main): "Cookie craving? 🍪 Satisfy it with these Classic Chocolate Chip Cookies!"
- **Index 1** (Alt 1): "The BEST chocolate chip cookie recipe you'll ever need! 🍪"
- **Index 2** (Alt 2): "Happiness is a warm chocolate chip cookie. 😊"

### Step 3: Select Your Preferred Caption

To switch to an alternative caption, send the entire response back with your selection:

```bash
curl -X POST "http://localhost:8000/api/content/select-caption" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "instagram",
    "caption_index": 1,
    "generated_content": {
      "success": true,
      "message": "Generated content for 1 platform(s)",
      "generated_contents": [...],
      "recipe": {...},
      "total_generated": 1
    }
  }'
```

**Response:**
The selected caption becomes the main caption:

```json
{
  "generated_contents": [
    {
      "platform": "instagram",
      "caption": "The BEST chocolate chip cookie recipe you'll ever need! 🍪",
      "hashtags": ["cookies", "baking", "dessert"],
      "alternative_captions": [
        "Cookie craving? 🍪 Satisfy it with these Classic Chocolate Chip Cookies!",
        "Happiness is a warm chocolate chip cookie. 😊"
      ],
      "selected_caption_index": 1
    }
  ]
}
```

---

## 💻 Frontend Integration Example

### React Example

```jsx
import { useState } from 'react';

function CaptionSelector({ generatedContent, platform }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const platformContent = generatedContent.generated_contents.find(
    c => c.platform === platform
  );

  // All available captions
  const allCaptions = [
    platformContent.caption,
    ...platformContent.alternative_captions
  ];

  const handleSelectCaption = async (index) => {
    const response = await fetch('/api/content/select-caption', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform: platform,
        caption_index: index,
        generated_content: generatedContent
      })
    });

    const updated = await response.json();
    setSelectedIndex(index);
    // Update your state with the new content
  };

  return (
    <div className="caption-selector">
      <h3>Select Your Caption</h3>
      
      {allCaptions.map((caption, index) => (
        <div 
          key={index}
          className={`caption-option ${selectedIndex === index ? 'selected' : ''}`}
          onClick={() => handleSelectCaption(index)}
        >
          <input 
            type="radio" 
            checked={selectedIndex === index}
            onChange={() => handleSelectCaption(index)}
          />
          <label>
            {index === 0 ? '🌟 Main Caption' : `✨ Alternative ${index}`}
          </label>
          <p>{caption}</p>
        </div>
      ))}
    </div>
  );
}
```

### JavaScript Example

```javascript
// Store the generated content
let generatedContent = null;

// Generate content
async function generateContent(recipeData) {
  const response = await fetch('/api/content/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipe_data: recipeData,
      target_platforms: ['instagram', 'twitter'],
      tone: 'warm and inviting',
      include_emojis: true,
      max_hashtags: 10
    })
  });
  
  generatedContent = await response.json();
  displayCaptions(generatedContent);
}

// Display captions with selection UI
function displayCaptions(content) {
  const container = document.getElementById('captions');
  
  content.generated_contents.forEach(platformContent => {
    const allCaptions = [
      platformContent.caption,
      ...platformContent.alternative_captions
    ];
    
    allCaptions.forEach((caption, index) => {
      const div = document.createElement('div');
      div.innerHTML = `
        <input 
          type="radio" 
          name="${platformContent.platform}-caption"
          value="${index}"
          ${index === platformContent.selected_caption_index ? 'checked' : ''}
          onchange="selectCaption('${platformContent.platform}', ${index})"
        />
        <label>${index === 0 ? 'Main' : `Alt ${index}`}: ${caption}</label>
      `;
      container.appendChild(div);
    });
  });
}

// Select a caption
async function selectCaption(platform, captionIndex) {
  const response = await fetch('/api/content/select-caption', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      platform: platform,
      caption_index: captionIndex,
      generated_content: generatedContent
    })
  });
  
  generatedContent = await response.json();
  console.log('Caption selected:', generatedContent);
}
```

---

## 🎨 UI/UX Best Practices

### 1. Visual Indication

Show which caption is currently selected:

```css
.caption-option {
  padding: 15px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  margin: 10px 0;
  cursor: pointer;
  transition: all 0.3s;
}

.caption-option.selected {
  border-color: #4CAF50;
  background-color: #f1f8f4;
}

.caption-option:hover {
  border-color: #2196F3;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}
```

### 2. Label Captions Clearly

```html
<div class="caption-option">
  <span class="caption-badge">Main Caption</span>
  <p class="caption-text">Cookie craving? 🍪 Satisfy it...</p>
  <span class="caption-length">120 characters</span>
</div>

<div class="caption-option">
  <span class="caption-badge alt">Alternative 1</span>
  <p class="caption-text">The BEST chocolate chip cookie...</p>
  <span class="caption-length">85 characters</span>
</div>
```

### 3. Show Character Count

Help users choose based on platform limits:

```javascript
function getCharacterCount(caption) {
  return caption.length;
}

function getPlatformLimit(platform) {
  const limits = {
    'instagram': 2200,
    'twitter': 280,
    'threads': 500,
    'facebook': 63206,
    'linkedin': 3000
  };
  return limits[platform] || 500;
}

function isWithinLimit(caption, platform) {
  return caption.length <= getPlatformLimit(platform);
}
```

---

## 📊 Caption Index Reference

| Index | Description | Example |
|-------|-------------|---------|
| 0 | Main Caption | The AI's primary suggestion |
| 1 | Alternative 1 | First alternative option |
| 2 | Alternative 2 | Second alternative option |
| 3+ | More alternatives | Additional variations (if available) |

---

## 🔄 Workflow Example

```
1. Generate Content
   ↓
2. Review All Captions
   ├─ Main Caption (Index 0)
   ├─ Alternative 1 (Index 1)
   └─ Alternative 2 (Index 2)
   ↓
3. User Selects Preferred Caption
   ↓
4. POST /api/content/select-caption
   ↓
5. Updated Content Returned
   ↓
6. Save to Database / Post to Social Media
```

---

## 💡 Tips

1. **Preview All Options**: Show all captions side-by-side for easy comparison
2. **Character Limits**: Display character counts for each platform
3. **Tone Indicators**: Label captions by tone (professional, casual, fun, etc.)
4. **A/B Testing**: Track which captions perform better over time
5. **Save Preferences**: Remember user's caption preferences for future generations

---

## 🎯 Complete Example

```javascript
// Complete workflow
async function completeWorkflow() {
  // 1. Generate content
  const generated = await fetch('/api/content/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipe_data: { title: "Chocolate Cookies", /* ... */ },
      target_platforms: ['instagram']
    })
  }).then(r => r.json());

  console.log('Generated:', generated);

  // 2. User reviews captions
  const instagramContent = generated.generated_contents[0];
  console.log('Main caption:', instagramContent.caption);
  console.log('Alternatives:', instagramContent.alternative_captions);

  // 3. User selects alternative caption #1
  const updated = await fetch('/api/content/select-caption', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      platform: 'instagram',
      caption_index: 1,
      generated_content: generated
    })
  }).then(r => r.json());

  console.log('Updated caption:', updated.generated_contents[0].caption);
  console.log('Selected index:', updated.generated_contents[0].selected_caption_index);

  // 4. Save or post the content
  // await saveToDatabase(updated);
  // await postToSocialMedia(updated);
}
```

---

## 🚀 Next Steps

1. ✅ Generate content with `/api/content/generate`
2. ✅ Review all caption options
3. ✅ Select preferred caption with `/api/content/select-caption`
4. ✅ Save to database or post directly
5. ✅ Track performance and optimize

Happy content creating! 🎉
