# 📚 Claude Skill: Course Writer

## תכנון ה-Skill למכתבת לומדות

---

## 🎯 המטרה

בנות **Claude Skill** שיעזור למשתמשים לכתוב לומדות (courses) באיכות גבוהה ובצורה מובנית.

---

## 📋 מה הSkill יעשה

### Input:
```
משתמש: "כתוב לי קורס על Python"
או
"בנה קורס עם 5 פרקים על Machine Learning"
```

### Output:
```
✅ קורס מוכן עם:
- כותרת קורס
- תיאור מלא
- 5 פרקים
- לכל פרק:
  * כותרת
  * תיאור עמוק
  * נקודות עיקריות
  * דוגמאות קוד/תמונות
  * תרגילים
  * שאלות quiz
```

---

## 🏗️ ארכיטקטורה

### Skill Inputs:
```
1. Course Topic (חובה)
   "Python", "Web Development", "Marketing"

2. Level (default: Intermediate)
   "Beginner", "Intermediate", "Advanced"

3. Number of Chapters (default: 5)
   3-10 chapters

4. Language (default: Hebrew)
   "Hebrew", "English"

5. Include (optional)
   "Code Examples", "Diagrams", "Exercises", "Quizzes"
```

### Skill Process:
```
1. Parse input
2. Generate course structure
3. Fill in content for each chapter
4. Add exercises & quizzes
5. Format as markdown/JSON
6. Return structured course
```

### Skill Output:
```
{
  "course": {
    "title": "...",
    "description": "...",
    "level": "...",
    "chapters": [
      {
        "number": 1,
        "title": "...",
        "content": "...",
        "examples": [],
        "exercises": [],
        "quiz": []
      },
      ...
    ]
  }
}
```

---

## 🛠️ Skill Functions

### 1. Generate Course Structure
```
Input: topic, level, num_chapters
Output: Chapter titles, descriptions
```

### 2. Write Chapter Content
```
Input: chapter_title, topic
Output: Detailed content with examples
```

### 3. Create Exercises
```
Input: chapter_content
Output: 3-5 practical exercises
```

### 4. Generate Quiz
```
Input: chapter_content
Output: 5 questions (multiple choice)
```

### 5. Format Output
```
Input: All data
Output: Markdown or JSON
```

---

## 📖 Skill Knowledge Base

### From Our Project:

✅ **Udemy-style course design:**
- Hero section with course title
- Chapter navigation
- Progress tracking
- Rich content with formatting

✅ **Content structure:**
- Introduction
- Main content (3-5 sections)
- Key points
- Examples
- Exercises
- Summary
- Quiz

✅ **Best practices:**
- Clear learning objectives
- Practical examples
- Code snippets (if applicable)
- Visual hierarchy
- Summaries

✅ **Technical knowledge:**
- React, TypeScript, Node.js, PostgreSQL
- Deployment (Vercel, Railway)
- Git, GitHub
- Database design
- API design
- File uploads
- Rich text editing

✅ **Domain knowledge:**
- Engine courses (Piston, Jet)
- Technical explanations
- Advantages/disadvantages
- Specifications

---

## 🎨 Course Template

### Course Level:
```
Beginner: No prerequisites, explained from scratch
Intermediate: Some knowledge assumed, practical focus
Advanced: Deep dive, complex concepts, research
```

### Chapter Structure:
```
1. Learning Objectives
   - 3-5 things student will learn

2. Introduction
   - Hook: Why this matters?
   - Context: How it fits in course

3. Main Content
   - 3-5 sections
   - Each with explanation + examples

4. Key Takeaways
   - Summary of main points

5. Exercises
   - 3-5 hands-on tasks

6. Quiz
   - 5 questions to test understanding

7. Next Steps
   - What's in next chapter?
```

---

## 💡 Smart Features

### Auto-Detection:
```
Detect if topic requires:
- Code examples (programming)
- Diagrams (architecture, systems)
- Case studies (business)
- Videos (visual topics)
```

### Adapt Content:
```
If "Beginner":
- Explain all terms
- More examples
- Simpler exercises

If "Advanced":
- Skip basics
- Research papers
- Complex exercises
```

### Add Visuals:
```
If code: Add syntax highlighting
If process: Add ASCII diagrams
If data: Add tables
```

---

## 🎓 Example: How Skill Works

### User Input:
```
"Create a course on React for beginners"
```

### Skill Process:
```
1. Parse: topic=React, level=Beginner, chapters=5

2. Generate structure:
   - Chapter 1: What is React?
   - Chapter 2: Components & JSX
   - Chapter 3: State & Props
   - Chapter 4: Hooks
   - Chapter 5: Building a Project

3. For each chapter:
   - Write content
   - Add code examples
   - Create exercises
   - Generate quiz

4. Format as JSON:
   {
     "course": {
       "title": "React for Beginners",
       "chapters": [...]
     }
   }
```

### User Gets:
```
✅ Complete course ready to:
- Upload to LMS
- Use in teaching
- Sell as product
- Share with students
```

---

## 📊 Skill Statistics

### Input:
- 5 parameters (topic, level, chapters, language, include)
- Variable complexity

### Output:
- 1 structured course with 3-10 chapters
- Each chapter: 2000-3000 words
- Each chapter: 3-5 exercises
- Each chapter: 5 quiz questions

### Total Output:
- Per course: 15,000-30,000 words
- Fully formatted
- Ready to use

---

## 🔄 Skill Workflow

### Step 1: Analyze Request
```
Parse user input
Validate parameters
Set defaults if needed
```

### Step 2: Plan Course
```
Generate course outline
List chapter titles
Define objectives
```

### Step 3: Generate Content
```
For each chapter:
  - Write introduction
  - Write main content (3-5 sections)
  - Create examples
  - Write exercises
  - Generate quiz
```

### Step 4: Format
```
Structure as JSON or Markdown
Add metadata
Ensure consistency
```

### Step 5: Deliver
```
Return structured course
Include metadata (word count, duration)
Provide upload instructions
```

---

## 🎯 Use Cases

### 1. Course Creator
```
User: "Make a course on Digital Marketing"
Output: Complete 8-chapter course ready to teach
```

### 2. LMS Admin
```
User: "Generate course: Machine Learning, Advanced, 6 chapters"
Output: JSON format ready to import
```

### 3. Content Manager
```
User: "Create course: JavaScript, Beginner"
Output: Markdown files for each chapter
```

### 4. Educator
```
User: "Build Python course with exercises"
Output: Course + exercises + answer key
```

---

## 📝 Example Output Format

### Markdown:
```markdown
# Course: React for Beginners

## Chapter 1: Introduction to React

### Learning Objectives
- Understand what React is
- Learn why React is useful
- Set up React development environment

### Introduction
React is a JavaScript library...

### Main Content

#### Section 1: What is React?
React is a library for building...

#### Section 2: Why Use React?
React has several advantages:
- Component-based
- Reusable code
- Easy to test

#### Section 3: Setting Up
To get started with React:
```bash
npx create-react-app my-app
cd my-app
npm start
```

### Key Takeaways
- React is a JavaScript library for UI
- Components are reusable
- JSX makes React development easier

### Exercises
1. Create a simple React app
2. Build a component
3. Add props to component

### Quiz
1. What is React? (multiple choice)
2. Name 3 advantages of React
3. How do you create a React app?

---

### JSON:
```json
{
  "course": {
    "id": "uuid",
    "title": "React for Beginners",
    "description": "...",
    "level": "Beginner",
    "chapters": 5,
    "estimatedHours": 10,
    "chapters": [
      {
        "number": 1,
        "title": "Introduction to React",
        "learning_objectives": [...],
        "content": "...",
        "code_examples": [...],
        "exercises": [...],
        "quiz": [...]
      }
    ]
  }
}
```

---

## 🚀 Implementation Notes

### Technology:
- Use Claude API (or integrate with Claude Code)
- LLM for content generation
- Structured output (JSON/Markdown)

### Features:
- Multi-language support
- Multiple difficulty levels
- Optional code examples
- Auto-generated exercises
- Quiz generation

### Quality Assurance:
- Check for clarity
- Verify examples work
- Ensure consistency
- Validate structure

---

## 📊 Metrics

### Quality Measures:
```
✅ Content clarity: All terms explained
✅ Examples: Code runs without errors
✅ Exercises: Solvable with chapter knowledge
✅ Quiz: Tests main concepts
✅ Structure: Consistent across chapters
```

### Output Stats:
```
Words per chapter: 2000-3000
Exercises per chapter: 3-5
Quiz questions per chapter: 5
Code examples: 2-5 per chapter
Time to read: 45-60 minutes per chapter
```

---

## 💻 How to Build

### Option 1: Standalone Claude Skill
```
Create custom Claude personality
Configure to generate courses
Train on course examples
Deploy as skill
```

### Option 2: API Integration
```
Build API endpoint
Input: course parameters
Output: structured course
Integrate with LMS
```

### Option 3: CLI Tool
```
npm install @coursewriter/cli
course-writer --topic Python --level Beginner --chapters 5
```

---

## 🎓 Knowledge from Our Project

### Course Structure We Used:
- Introduction (why this matters)
- Main content (organized sections)
- Key concepts (summarized)
- Practical examples (code or real-world)
- Advanced topics (if applicable)
- Quiz/exercises (validation)

### Content Quality We Achieved:
- Engine courses with 5 chapters each
- Deep content (800-1100 words per topic)
- Technical specifications
- Advantages/disadvantages analysis
- Clear learning path

### Formatting We Implemented:
- WYSIWYG editor for content
- Rich text support (bold, italic, lists)
- HTML rendering for display
- File uploads for resources
- Dark/light mode for reading comfort

---

## 🔮 Future Enhancements

### Phase 2:
- Interactive lessons
- Video integration
- Peer review system
- Student feedback

### Phase 3:
- Certification exams
- Instructor dashboard
- Student progress tracking
- Community features

### Phase 4:
- AI-powered personalization
- Adaptive learning paths
- Automated grading
- Real-time collaboration

---

**This Skill is designed based on:**
- Real course building experience (rf-learning system)
- Best practices from Udemy and other LMS platforms
- Knowledge accumulated from building the learning system

