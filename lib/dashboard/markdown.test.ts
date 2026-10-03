import { describe, expect, it } from "vitest"
import { markdownToHtml } from "./markdown"

describe("markdownToHtml", () => {
  it("escapes HTML so AI or user content cannot inject markup", () => {
    const html = markdownToHtml('<script>alert("x")</script> & <img src=x onerror=alert(1)>')
    expect(html).not.toContain("<script>")
    expect(html).not.toContain("<img")
    expect(html).toContain("&lt;script&gt;")
    expect(html).toContain("&amp;")
  })

  it("renders headings, bold and italic", () => {
    const html = markdownToHtml("## Goals\n**Save** more, *spend* less")
    expect(html).toContain("<h2")
    expect(html).toContain(">Goals</h2>")
    expect(html).toContain("<strong>Save</strong>")
    expect(html).toContain("<em>spend</em>")
  })

  it("groups consecutive list items into one list", () => {
    const html = markdownToHtml("- one\n- two")
    expect(html.match(/<ul/g)).toHaveLength(1)
    expect(html.match(/<li/g)).toHaveLength(2)
  })
})
