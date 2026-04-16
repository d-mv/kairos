defmodule Kairos.UrlParserTest do
  use ExUnit.Case, async: true

  alias Kairos.UrlParser

  describe "detect_service/1" do
    test "detects youtube.com" do
      assert UrlParser.detect_service("https://www.youtube.com/watch?v=abc") == :youtube
    end

    test "detects youtu.be" do
      assert UrlParser.detect_service("https://youtu.be/abc123") == :youtube
    end

    test "detects instagram.com" do
      assert UrlParser.detect_service("https://www.instagram.com/p/abc") == :instagram
    end

    test "detects twitter.com" do
      assert UrlParser.detect_service("https://twitter.com/user/status/123") == :twitter
    end

    test "detects x.com" do
      assert UrlParser.detect_service("https://x.com/user/status/123") == :twitter
    end

    test "detects github.com" do
      assert UrlParser.detect_service("https://github.com/elixir-lang/elixir") == :github
    end

    test "detects notion.so" do
      assert UrlParser.detect_service("https://notion.so/page-123") == :notion
    end

    test "detects linear.app" do
      assert UrlParser.detect_service("https://linear.app/team/issue/ENG-1") == :linear
    end

    test "returns nil for unknown domain" do
      assert UrlParser.detect_service("https://example.com/page") == nil
    end

    test "returns nil for invalid url" do
      assert UrlParser.detect_service("not-a-url") == nil
    end
  end

  describe "extract_title_from_html/1" do
    test "extracts title from well-formed HTML" do
      html = "<html><head><title>Hello World</title></head><body></body></html>"
      assert UrlParser.extract_title_from_html(html) == "Hello World"
    end

    test "extracts title with attributes on title tag" do
      html = ~s(<title lang="en">My Page</title>)
      assert UrlParser.extract_title_from_html(html) == "My Page"
    end

    test "returns nil when no title tag" do
      html = "<html><body>No title here</body></html>"
      assert UrlParser.extract_title_from_html(html) == nil
    end

    test "handles case-insensitive title tag" do
      html = "<TITLE>Upper Case</TITLE>"
      assert UrlParser.extract_title_from_html(html) == "Upper Case"
    end
  end
end
