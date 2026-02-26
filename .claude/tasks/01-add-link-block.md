You are an expert Shopify theme developer with 5+ years experience in Online Store 2.0 themes, sections, blocks, and Liquid (using @shopify/cli ~3.89.0, Node 22.x).

Task: Add a new reusable "Link Block" to the current Shopify theme.

Context:

- This is a modern Shopify theme using sections & blocks (OS 2.0+)
- The block will be used inside various sections (e.g. rich text, custom liquid, multicolumn, featured collection…)
- Prefer creating it as a standalone **theme block** (.liquid file in blocks/ folder) for maximum reusability across sections
- If the theme doesn't support theme blocks well yet, fall back to adding it as a block type inside a relevant section schema
- Use clean, semantic setting IDs/labels (kebab-case or snake_case consistently)
- Make it responsive (mobile-first, use theme's utility classes or flex/grid)
- Match existing theme styling (assume Tailwind, Dawn-like classes like 'button', 'button--primary', 'link', etc. if not specified)
- Support accessibility: proper <a> semantics, aria-label if text is icon-only (but here it's text-based), focus states
- Include meaningful presets for good preview in theme editor

Requirements for the "Link Block":

1. Settings (all required unless noted):
   - Link Text (text, required, default: "Learn More")
   - URL (url, required, supports internal/external/shop links)
   - Open in new tab? (checkbox, default: false)
   - Button style (select: primary / secondary / outline / text-link, default: primary)
   - Alignment (select: left / center / right, default: left)
2. Rendering:
   - Use <a> tag with href from settings.link_url
   - target="\_blank" + rel="noopener noreferrer" if open_in_new_tab checked
   - Apply theme-appropriate classes (e.g. button button--primary, or link underline)
   - Fully responsive and accessible
3. Schema:
   - Add presets with meaningful name
   - Suggest a reasonable max blocks limit if added to a section (e.g. limit: 10)
   - No external dependencies, pure Liquid + theme CSS/JS

Output structure – provide in this exact order:

1. Suggested file path (e.g. blocks/link-block.liquid or note if adding to existing section)
2. Full {% schema %} block (use JSON5 style with comments for clarity)
3. The complete Liquid/HTML rendering code (inside the file)
4. Any additional notes (CSS classes needed, potential improvements, etc.)

Example schema pattern to follow:

{% schema %}
{
"name": "Link",
"tag": "div",
"class": "link-block",
"settings": [
{
"type": "text",
"id": "link_text",
"label": "Link text",
"default": "Shop Now"
},
{
"type": "url",
"id": "link_url",
"label": "Link URL"
}
// ... more settings
],
"presets": [
{
"name": "Link"
}
]
}
{% endschema %}

After generating the complete code:

Step-by-step self-review & fix:

1. Check for Liquid syntax errors (unclosed tags, invalid filters, missing {% endif %}, etc.)
2. Validate schema JSON: correct types, no duplicate IDs, proper defaults, required fields marked if needed
3. Verify link rendering: correct href, target/rel security, no broken Liquid variables
4. Accessibility & responsiveness: proper semantics, no layout shifts, mobile-friendly
5. Consistency: classes match common Shopify theme patterns (Dawn/Impulse/etc.)
6. Performance: no heavy logic, no unnecessary renders
7. If any issues found (syntax error, bad practice, potential bug), fix them inline and explain what was corrected.
8. Output the FINAL corrected version of the code (with any fixes applied).
9. End with a summary: "Code reviewed: [list any fixes or 'No issues found']"

Start implementing now. Write complete, production-ready code, then perform the self-review and provide the final version.
