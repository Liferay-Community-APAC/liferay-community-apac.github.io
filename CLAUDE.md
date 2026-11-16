## Git authorship
- Never author, co-author, or sign anything in git as Claude. Do not add `Co-Authored-By: Claude …` trailers, `🤖 Generated with Claude Code` lines, or any other Claude/Anthropic attribution to commit messages, PR titles/descriptions, tags, or code comments.
- Never set or override git `user.name` / `user.email` (or `GIT_AUTHOR_*` / `GIT_COMMITTER_*`) to a Claude or Anthropic identity; commits use the committer's own git identity.
