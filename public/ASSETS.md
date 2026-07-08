# Project Seal New — Assets

## Images (provided)

| File | Usage |
|------|-------|
| `seal.png` | Seal particle outline |
| `weiwei.png` | Portrait particle shape |
| `cat.png` | Cat with cake |
| `text.png` | Blessing text template |

## Birthday music

- **`birthday.wav`** — synthesized from the public-domain *Happy Birthday to You* melody (~14s). Regenerate with:

  ```bash
  npm run generate:birthday
  ```

- **`birthday.ncm`** — NetEase Cloud Music encrypted format; browsers cannot play this. You can delete it.

- Phase 5 will load `config.assets.birthday`.
- Music starts **2 seconds after the cat/cake appears** (timeline: 20s + 2s = **22s**).
