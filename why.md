# Why And How This Application Was Built

At the surface, this is just another Sudoku app.

The real reason it exists is because I wanted to learn how to work with the latest version of GitHub Copilot, hopefully in a productive way. Not just using it as autocomplete, instead actually understanding the newest interaction models and seeing what happens if you let it participate in an entire project from start to finish.

I love games that keep my mind sharp. One of my longtime favorites is Sudoku. It looks simple at first, then gets complex fast. It's layers on layers that will make your eyes water, like an onion...

Most Sudoku apps are honestly kind of terrible. Too many ads, strange UX decisions, weird bugs, or gameplay that feels off in ways that are hard to explain until you spend time with it.

So, I vibe coded one myself... Completely... With Copilot...

Yep.

Right about now you might (rightfully) assume that the project is garbage since I admit that AI somehow "built" the whole thing "for me." If you review the docs, designs, plans, and code, I think you will discover that while AI may have been the hands on keys, the design decisions and standards are still mine.

The app itself is intentionally simple:

- Pure JavaScript.
- No React.
- No framework stack.
- No complicated build system.

The only external dependency is YAML parsing because I had no interest in vibe coding a YAML parser.

I've discovered that this project is a lot like any other project with any other team. While Copilot is a single AI, multiple instances were used with multiple models, basically making it a team effort.

A lot of this project became an exercise in reinforcing boundaries; Separation of concerns became my mantra. I find myself constantly typing "Remember the project standards, keep things simple, work in phases, remember separation of concerns, testing is important, keep code idempotent and pure" when I ask Copilot to execute a plan.

My experience so far is that the "better" Copilot gets, the more important project structure, standards, and reinforcement become.

Hopefully you take a walk through the code. If you do, please remember:

AI wrote all the code.

Not just AI. What most people currently consider the "worst" AI wrote this code.
