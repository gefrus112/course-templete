# Contributing to CoursePress 🎓

Thanks for helping teachers sell courses!

## Ways to contribute
- 🐛 Report bugs (use the Bug Report issue form)
- 📚 Add an example course (edit `courses.json` + slides)
- 🎨 Improve theme / mobile UX
- 📖 Improve docs

## Quick dev loop
```bash
npm install
npm start
npm test
```

## Adding a course
1. Add an entry to `courses.json` (copy the Scratch course shape).
2. Keep `slug` URL-safe, `price` in USD, 3-6 slides per course.
3. Test: open `#/course/your-slug`, click through slides, buy via mock checkout.
