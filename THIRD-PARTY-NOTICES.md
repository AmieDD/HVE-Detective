# Third-Party Notices

HVE Detective is licensed under the MIT License (see [LICENSE](LICENSE)). The directory reproduces
excerpts from the third-party project listed below. Those excerpts remain under their original
licenses.

## microsoft/hve-core

- Source: <https://github.com/microsoft/hve-core>
- Version: the exact upstream commit is recorded as `source.sha` in `src/data/catalog.json` and is
  linked from the site footer.
- What is reproduced: names, slash commands, descriptions, first introductory paragraphs, H2 and H3
  section headings, and frontmatter metadata (argument hints, handoff labels and targets, subagent
  names, license identifiers) of the agents, prompts, and skills listed in the upstream
  `plugin.json`.
- Changes: text is extracted from each file's YAML frontmatter and Markdown body, whitespace is
  normalized, and only the fields above are kept. Nothing else from the upstream files is included.
- Upstream notices: hve-core attributes material embedded in its skills and instructions in its own
  notices file, <https://github.com/microsoft/hve-core/blob/main/THIRD-PARTY-NOTICES>. Those notices
  also apply to any excerpt of that material shown in this directory.

### Repository license (MIT)

Agents, prompts, and skills that declare no license, or declare `MIT`, are covered by the hve-core
repository license:

```text
MIT License

Copyright (c) Microsoft Corporation. All rights reserved.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### Skills with other declared licenses

Some skills declare a different license in their frontmatter, either alone or as a compound SPDX
expression such as `CC-BY-4.0 AND MIT`. Each skill's declared license is shown in its detail view in
the directory, and excerpts from that skill are shared under that license. Authors and sources are
declared in each skill's `metadata.authors` field and in the upstream notices file.

| SPDX identifier | License | License text | Declared sources include |
|-----------------|---------|--------------|--------------------------|
| `CC-BY-4.0` | Creative Commons Attribution 4.0 International | <https://creativecommons.org/licenses/by/4.0/> | Microsoft; Microsoft Code With Engineering Playbook; NIST; Google LLC; Australian Signals Directorate (ACSC) |
| `CC-BY-SA-4.0` | Creative Commons Attribution-ShareAlike 4.0 International | <https://creativecommons.org/licenses/by-sa/4.0/> | OWASP Foundation projects |
| `CC-BY-SA-3.0` | Creative Commons Attribution-ShareAlike 3.0 Unported | <https://creativecommons.org/licenses/by-sa/3.0/> | OWASP (privacy risks) |
| `Apache-2.0` | Apache License, Version 2.0 | <https://www.apache.org/licenses/LICENSE-2.0> | OpenVEX Community |
| `OGL-UK-3.0` | Open Government Licence v3.0 | <https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/> | UK Government Security Group |

Excerpts from skills under a ShareAlike license are shared under the same license. Skills under the
Open Government Licence contain public sector information licensed under the Open Government Licence
v3.0.
