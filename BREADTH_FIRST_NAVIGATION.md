# Breadth-First Job Discovery System

## 🧭 **Intelligent Web Navigation**

GemScout now implements **true breadth-first search** for job discovery. You can start on **any company homepage** and the AI will intelligently navigate to find their career opportunities.

## 🎯 **How It Works**

### **Step 1: Page Analysis**
```
🌍 Analyzing page at depth 0: https://company.com
AI asks: "Does this page contain job opportunities?"
```

### **Step 2: Navigation Discovery**
```
🧦 If no jobs found, AI analyzes links:
"What links might lead to career/hiring pages?"
AI identifies: ["/careers", "/jobs", "/about/team"]
```

### **Step 3: Intelligent Navigation**
```
🛫 Navigating to: https://company.com/careers
🌍 Analyzing page at depth 1: https://company.com/careers
```

### **Step 4: Job Discovery**
```
✅ Found 5 jobs at: https://company.com/careers
🧦 Navigation path: company.com → company.com/careers
```

## 🚀 **User Experience**

### **Starting Point: Any Company Page**
- Visit **any company homepage**
- Click **"Scan Current Page (Fast)"**
- Watch AI navigate automatically to find jobs

### **AI Navigation Process**
1. **Homepage Analysis**: "No jobs here, but I see a 'Careers' link"
2. **Smart Navigation**: "Let me navigate to /careers"
3. **Job Discovery**: "Found job postings! Extracting opportunities"
4. **Results**: Shows jobs with navigation path

### **Visual Feedback**
```
🧦 AI Navigation Path:
company.com → careers.company.com
Found jobs at: /careers/opportunities
```

## 🔍 **AI Navigation Logic**

### **Link Analysis Prompt**
```
"You are a web navigation AI. Find links that might lead to career/employment opportunities.

Consider text like:
- 'Careers', 'Jobs', 'Work with us', 'Join us'
- 'Opportunities', 'Hiring', 'Team'
- Company-specific patterns: 'About' → 'Careers'

Return top 3 most promising URLs in order of likelihood."
```

### **Navigation Strategy**
- **Depth Limit**: Max 3 levels deep
- **Visited Tracking**: Avoids circular navigation
- **AI Ranking**: Most promising links first
- **Error Handling**: Graceful fallback on navigation failures

## 🎨 **Technical Implementation**

### **Navigation Flow**
```javascript
for (let depth = 0; depth < maxDepth; depth++) {
  // 1. Analyze current page for jobs
  const result = await analyzePageForJobs(snapshot)
  
  if (result.hasJobs) {
    return result // Found jobs, return them
  }
  
  // 2. Find navigation targets using AI
  const targets = await findNavigationTargets(snapshot)
  
  // 3. Navigate to most promising target
  const nextUrl = targets[0]
  snapshot = await fetchPageSnapshot(nextUrl)
}
```

### **AI Navigation Prompt**
- Analyzes available links intelligently
- Considers context and link text
- Returns ranked list of navigation targets
- No keyword assumptions - pure AI analysis

### **Page Navigation**
- Currently opens URL in same tab (user sees navigation)
- Future: Could use background fetch for seamless experience
- Collects fresh snapshot after each navigation
- Updates progress with navigation path

## 🧪 **Example Navigation Scenarios**

### **Scenario 1: Tech Company**
```
Start: https://stripe.com
AI finds: "Join us" link → https://stripe.com/jobs
Result: 8 job opportunities discovered
```

### **Scenario 2: Traditional Company**
```
Start: https://boeing.com
AI finds: "About" → "Careers" → https://boeing.com/careers
Result: 12 job opportunities discovered
```

### **Scenario 3: Startup**
```
Start: https://newstartup.com
AI finds: "Team" → "We're hiring" → /join-our-team
Result: 3 job opportunities discovered
```

## ✅ **Benefits**

### **1. Universal Job Discovery**
- Start on **any company homepage**
- No need to know their careers URL structure
- AI finds the path to opportunities

### **2. Intelligent Navigation**
- AI understands company-specific patterns
- Considers context, not just link text
- Breadth-first ensures optimal path discovery

### **3. Transparency**
- Shows exact navigation path taken
- User sees where jobs were discovered
- Clear audit trail of AI decisions

### **4. Efficiency**
- Finds shortest path to career content
- Avoids deep rabbit holes
- Focuses on job-relevant pages only

## 🚧 **Current Limitations**

1. **Navigation Visibility**: User sees page changes (could be background in future)
2. **Depth Limit**: Currently limited to 3 levels (configurable)
3. **Single Path**: Follows most promising path (could explore multiple paths)
4. **No Authentication**: Can't navigate through login-required career portals

## 🎉 **The Result**

**True breadth-first job discovery**: Start anywhere on a company's website and let AI intelligently navigate to find career opportunities, showing you exactly how it discovered the jobs! 🧭✨