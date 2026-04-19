defmodule Kairos.UrlParser do
  @moduledoc """
  Fetches page titles and detects service types from URLs.
  """

  @youtube_oembed "https://www.youtube.com/oembed"

  @doc """
  Fetch page title and detect service type from a URL.

  Returns `{:ok, %{title: string | nil, service: atom | nil}}` or `{:error, term}`.
  """
  def fetch_metadata(url) do
    service = detect_service(url)

    case fetch_title(url, service) do
      {:ok, title} -> {:ok, %{title: title, service: service}}
      {:error, reason} -> {:error, reason}
    end
  end

  @doc "Detect which known service a URL belongs to, or nil."
  def detect_service(url) do
    case URI.parse(url) do
      %URI{host: host} when is_binary(host) -> classify_host(host)
      _ -> nil
    end
  end

  @doc "Extract the page title from an HTML string."
  def extract_title_from_html(html) do
    case Regex.run(~r/<title[^>]*>([^<]+)<\/title>/i, html) do
      [_, title] -> String.trim(title)
      _ -> nil
    end
  end

  # Private

  defp classify_host(host) do
    host = String.replace_leading(host, "www.", "")

    cond do
      host in ["youtube.com", "youtu.be"] -> :youtube
      host == "instagram.com" -> :instagram
      host in ["twitter.com", "x.com"] -> :twitter
      host == "github.com" -> :github
      host == "notion.so" -> :notion
      host == "linear.app" -> :linear
      true -> nil
    end
  end

  defp fetch_title(url, :youtube) do
    case Req.get(@youtube_oembed, params: [url: url, format: "json"], receive_timeout: 5_000) do
      {:ok, %{status: 200, body: %{"title" => title, "author_name" => author}}} ->
        {:ok, "#{author}: #{title}"}

      {:ok, %{status: 200, body: %{"title" => title}}} ->
        {:ok, title}

      _ ->
        fetch_title_from_html(url)
    end
  end

  defp fetch_title(url, :instagram) do
    headers = [{"user-agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"}]

    case Req.get(url, headers: headers, receive_timeout: 5_000, max_redirects: 5) do
      {:ok, %{status: 200, body: body}} when is_binary(body) ->
        description = extract_meta_name(body, "description")

        title =
          if description do
            description
            |> decode_html_entities()
            |> parse_instagram_description()
          end

        {:ok, title}

      _ ->
        {:ok, nil}
    end
  end

  defp fetch_title(url, _), do: fetch_title_from_html(url)

  defp parse_instagram_description(text) do
    # Format: "15K likes, 142 comments - account on Date: "post text""
    case Regex.run(~r/^.*? - (.+?) on .+?: "(.+)"$/s, text) do
      [_, account, content] -> "#{account}: #{String.slice(content, 0, 200)}"
      _ -> String.slice(text, 0, 200)
    end
  end

  defp extract_meta_name(html, name) do
    patterns = [
      ~r/<meta[^>]+name=["']#{name}["'][^>]+content=["']([^"']+)["']/i,
      ~r/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']#{name}["']/i
    ]

    Enum.find_value(patterns, fn pattern ->
      case Regex.run(pattern, html) do
        [_, content] -> content
        _ -> nil
      end
    end)
  end

  defp decode_html_entities(text) do
    text
    |> String.replace("&quot;", "\"")
    |> String.replace("&amp;", "&")
    |> String.replace("&lt;", "<")
    |> String.replace("&gt;", ">")
    |> String.replace("&apos;", "'")
    |> String.replace(~r/&#x([0-9a-fA-F]+);/, fn _, hex ->
      <<String.to_integer(hex, 16)::utf8>>
    end)
    |> String.replace(~r/&#([0-9]+);/, fn _, dec ->
      <<String.to_integer(dec)::utf8>>
    end)
  end

  defp fetch_title_from_html(url) do
    case Req.get(url, receive_timeout: 5_000, max_redirects: 5) do
      {:ok, %{status: status, body: body}} when status in 200..299 and is_binary(body) ->
        {:ok, extract_title_from_html(body)}

      {:ok, _} ->
        {:ok, nil}

      {:error, reason} ->
        {:error, reason}
    end
  end
end
