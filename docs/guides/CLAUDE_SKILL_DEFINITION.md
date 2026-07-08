# Claude Skill: Course Writer

## Skill Definition & Configuration

---

## 📋 Skill Metadata

```yaml
name: "Course Writer"
description: "Generate complete, structured courses on any topic with chapters, exercises, and quizzes"
author: "Yair"
version: "1.0"
tags: ["education", "content-creation", "courses", "learning"]
capabilities: ["course-design", "content-generation", "exercise-creation", "quiz-generation"]
```

---

## 🎯 Skill Purpose

**Generate professional-quality courses** that include:
- Well-structured chapters
- Learning objectives
- Rich content with examples
- Practical exercises
- Self-assessment quizzes
- Professional formatting

---

## 📥 Input Parameters

### Required:
```
1. Topic (string)
   "Python Programming", "Digital Marketing", "Web Design"
   What subject should the course teach?
```

### Optional (with defaults):
```
2. Level (enum, default: "Intermediate")
   "Beginner" - No prerequisites
   "Intermediate" - Some knowledge assumed
   "Advanced" - Deep dive into topic

3. Chapters (number, default: 5)
   Range: 3-10 chapters
   How many chapters should the course have?

4. Language (enum, default: "English")
   "English", "Hebrew", "Spanish", "French"
   What language for the course?

5. Include (multi-select, default: ["content", "exercises", "quizzes"])
   "code-examples" - Add code snippets
   "diagrams" - Add ASCII diagrams
   "case-studies" - Real-world examples
   "resources" - External resources
   "assignments" - Larger projects
```

---

## 📤 Output Format

### Structure:

```json
{
  "course": {
    "metadata": {
      "id": "generated-uuid",
      "title": "Course Title",
      "description": "Detailed course description",
      "level": "Beginner|Intermediate|Advanced",
      "language": "en|he|es|fr",
      "chapters": 5,
      "estimated_hours": 12,
      "created_at": "2024-01-01T00:00:00Z",
      "word_count": 15000
    },
    "learning_objectives": [
      "Objective 1",
      "Objective 2",
      "Objective 3"
    ],
    "chapters": [
      {
        "number": 1,
        "title": "Chapter Title",
        "learning_objectives": ["...", "...", "..."],
        "sections": [
          {
            "title": "Section Title",
            "content": "Detailed content...",
            "key_points": ["Point 1", "Point 2", "Point 3"]
          }
        ],
        "content": "Full chapter content",
        "examples": [
          {
            "title": "Example 1",
            "type": "code|text|diagram",
            "content": "..."
          }
        ],
        "exercises": [
          {
            "number": 1,
            "title": "Exercise Title",
            "description": "What to do",
            "difficulty": "easy|medium|hard"
          }
        ],
        "quiz": [
          {
            "number": 1,
            "question": "Question text?",
            "type": "multiple-choice|true-false|short-answer",
            "options": ["A", "B", "C", "D"],
            "correct_answer": "A",
            "explanation": "Why A is correct"
          }
        ],
        "summary": "Key takeaways from chapter",
        "next_chapter_preview": "What's next?"
      }
    ],
    "resources": {
      "further_reading": ["Resource 1", "Resource 2"],
      "tools_required": ["Tool 1", "Tool 2"],
      "external_links": ["Link 1", "Link 2"]
    }
  }
}
```

---

## 🎨 Content Template

### Chapter Structure:

```
1. **Learning Objectives** (2-3 minutes)
   - 3-5 clear, measurable learning outcomes
   
2. **Introduction** (5 minutes)
   - Hook: Why is this important?
   - Context: How does it relate to previous/next chapters?
   - Overview: What will we cover?

3. **Main Content** (30-40 minutes)
   Section 1: Concept explanation
   Section 2: How it works
   Section 3: Why it matters
   Section 4: Practical application
   
   Each section includes:
   - Clear explanation
   - Real-world examples
   - Code examples (if applicable)
   - Visual diagrams (if helpful)

4. **Key Takeaways** (5 minutes)
   - 5-7 bullet points summarizing main ideas

5. **Practical Exercises** (15-20 minutes)
   - 3-5 hands-on exercises
   - Increasing difficulty
   - Solutions provided
   - Time estimates for each

6. **Self-Assessment Quiz** (10 minutes)
   - 5 questions testing chapter concepts
   - Mix of question types
   - Explanations for correct answers

7. **Next Steps** (2 minutes)
   - Preview of next chapter
   - How concepts connect
   - What to review if struggling
```

---

## 🧠 Skill Behavior Rules

### Content Guidelines:

```
✅ DO:
- Use clear, simple language
- Explain jargon when first used
- Provide concrete examples
- Use analogies for complex concepts
- Include "why" not just "how"
- Test for understanding with exercises

❌ DON'T:
- Assume prior knowledge (unless Advanced level)
- Use unexplained technical terms
- Make content too long (aim for 45-60 min per chapter)
- Skip the "why" behind concepts
- Use overly complex sentences
- Make exercises unsolvable with chapter knowledge
```

### Quality Standards:

```
Clarity Score: Every sentence should be understandable
Completeness: Every concept explained sufficiently
Consistency: Same terminology throughout
Engagement: Examples match student interest
Practical: Students can apply what they learn
Accessible: Beginner level ≠ "dumbed down"
```

---

## 🔄 Skill Workflow

### Step 1: Parse Input
```
Extract topic, level, chapters, language, inclusions
Validate parameters
Set defaults
```

### Step 2: Generate Course Outline
```
Create course title
Write course description
Define overall learning objectives
Generate chapter titles
Create chapter descriptions
```

### Step 3: Generate Course Content
```
For each chapter (5-10 iterations):
  1. Write learning objectives
  2. Write introduction
  3. Generate main content (4 sections)
  4. Create key takeaways
  5. Design exercises (3-5)
  6. Create quiz (5 questions)
  7. Write summary & next steps
```

### Step 4: Add Examples & Resources
```
Add code examples (if applicable)
Add diagrams (if helpful)
Add case studies (if requested)
Compile resources
```

### Step 5: Format & Validate
```
Structure as JSON
Validate all fields
Check word count
Verify consistency
```

### Step 6: Deliver
```
Return complete course
Include metadata
Provide upload instructions
Offer formatting options
```

---

## 💬 Example Interactions

### Conversation 1: Beginner Python Course

**User:**
> "Create a beginner course on Python"

**Skill Response:**
```
Topic: Python Programming
Level: Beginner
Chapters: 5 (auto-generated)
Language: English
Includes: Code examples

Generating course structure...

✅ Course Generated: "Python Programming for Beginners"
- 5 chapters
- ~12,000 words
- 15 code examples
- 25 exercises
- 25 quiz questions

Chapters:
1. Getting Started with Python
2. Variables & Data Types
3. Control Flow (If/Loops)
4. Functions & Modules
5. Working with Data

Ready to export as: JSON | Markdown | PDF
```

### Conversation 2: Advanced ML Course

**User:**
> "Advanced Machine Learning course, 8 chapters, include case studies and code"

**Skill Response:**
```
Topic: Machine Learning
Level: Advanced
Chapters: 8
Language: English
Includes: Code examples, case studies

Generating advanced course...

✅ Course Generated: "Advanced Machine Learning"
- 8 chapters
- ~24,000 words
- 40+ code examples
- 20+ case studies
- 40 quiz questions

Chapters:
1. Linear Regression Deep Dive
2. Classification Algorithms
3. Ensemble Methods
4. Deep Learning Fundamentals
5. Natural Language Processing
6. Computer Vision Basics
7. Model Optimization
8. Real-world Applications

Ready to export as: JSON | Markdown | PDF
```

---

## 🛠️ Integration Points

### With Our Learning System:
```
1. Generate course structure
2. Export as JSON
3. Import into rf-learning database
4. Students learn using Udemy-style interface
5. Track progress & completion
```

### As Standalone Tool:
```
1. User requests course
2. Skill generates content
3. Export to various formats
4. Use with any LMS
5. Sell as product
```

### As API:
```
POST /api/courses/generate
{
  "topic": "Python",
  "level": "Beginner",
  "chapters": 5
}

Response:
{
  "course": {...}
}
```

---

## 📊 Quality Metrics

### For Each Course:

```
Readability Score:
  - Grade level (Flesch-Kincaid)
  - Target: 8th-10th grade equivalent

Coverage Score:
  - % of topic covered
  - Target: 80%+

Exercise Difficulty:
  - Match chapter content
  - Progressive difficulty
  - Target: 90% solvable with chapter knowledge

Quiz Alignment:
  - Tests chapter concepts
  - Mix of question types
  - Target: 70% correct after completing chapter
```

---

## 🚀 Advanced Features

### Personalization:
```
Detect student learning style:
- Visual: Add more diagrams
- Kinesthetic: Add more hands-on exercises
- Auditory: Add narration notes
```

### Adaptive Content:
```
Adjust difficulty based on:
- Quiz performance
- Exercise completion rates
- Time spent per chapter
```

### Real-time Updates:
```
Update course content based on:
- Student feedback
- New industry developments
- Technology changes
```

---

## 📝 Example: Full Course Generation

### Input:
```
Topic: "Web Development Fundamentals"
Level: "Beginner"
Chapters: 4
Language: "English"
Include: ["code-examples", "diagrams"]
```

### Generated Course Structure:

```json
{
  "course": {
    "metadata": {
      "title": "Web Development Fundamentals",
      "description": "Learn the basics of web development including HTML, CSS, and JavaScript. Perfect for beginners with no prior experience.",
      "level": "Beginner",
      "chapters": 4,
      "estimated_hours": 8,
      "word_count": 9500
    },
    "chapters": [
      {
        "number": 1,
        "title": "Getting Started with Web Development",
        "learning_objectives": [
          "Understand what web development is",
          "Know the three pillars of web development",
          "Set up your development environment"
        ],
        "sections": [
          {
            "title": "What is Web Development?",
            "content": "Web development is the process of creating websites and web applications...",
            "key_points": ["HTML provides structure", "CSS provides style", "JavaScript provides interactivity"]
          }
        ],
        "exercises": [
          {
            "number": 1,
            "title": "Install Your First Code Editor",
            "description": "Download and install VS Code or your preferred code editor"
          }
        ],
        "quiz": [
          {
            "number": 1,
            "question": "What does HTML stand for?",
            "type": "multiple-choice",
            "options": ["Hyper Text Markup Language", "High Tech Modern Language", "Home Tool Markup Language"],
            "correct_answer": "Hyper Text Markup Language"
          }
        ]
      },
      // ... more chapters
    ]
  }
}
```

---

## 🎓 Use in Our Learning System

### Integration Steps:

```
1. User (admin) says:
   "Create a course on React"

2. Skill generates full course JSON

3. Admin imports via:
   POST /api/courses/import
   Body: {course_json}

4. Database creates:
   - Course record
   - 5 chapter records
   - Content items with rich text
   - Quiz questions

5. Students access via:
   /course/react
   - See chapters
   - Read rich content
   - Take quizzes
   - Track progress
```

---

## 💡 Knowledge Integration

### From Our Project:
- **Course structure:** Chapters → Content → Quizzes
- **Content types:** TEXT, RICH (HTML), IMAGE, FILE
- **User roles:** Admin (creates), Student (learns)
- **Features:** Rich editor, file uploads, progress tracking
- **Design:** Udemy-style with purple theme

### Skill Adds:
- **Auto-generation:** Create entire courses with one command
- **Quality:** Professional educational structure
- **Flexibility:** Multiple difficulty levels & languages
- **Integration:** Export to JSON, import to LMS

---

## 🔮 Future Directions

### v2 Features:
```
- AI tutoring integration
- Student feedback analysis
- Difficulty auto-adjustment
- Translation support
- Video generation
- Certificate creation
```

### v3 Features:
```
- Peer review system
- Instructor collaboration
- Student discussion forums
- Real-time analytics
- A/B testing for content
```

---

**This Skill encapsulates everything we learned building rf-learning and extends it into a powerful tool for creating courses at scale.**

