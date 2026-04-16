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
    # Instagram doesn't have a simple oEmbed without a token anymore,
    # but we can try to extract from OpenGraph tags in HTML
    case Req.get(url, receive_timeout: 5_000) do
      {:ok, %{status: 200, body: body}} ->
        author = extract_og(body, "og:title") # Often "Author (@handle) • Instagram..."
        description = extract_og(body, "og:description")

        title =
          cond do
            author && description ->
              # Clean up author string "Author (@handle) on Instagram"
              clean_author = author |> String.split("•") |> List.first() |> String.trim()
              "#{clean_author}: #{description}"

            author ->
              author

            true ->
              extract_title_from_html(body)
          end

        {:ok, title}

      _ ->
        {:ok, nil}
    end
  end

  defp fetch_title(url, _service) do
    fetch_title_from_html(url)
  end

  defp extract_og(html, property) do
    pattern = ~r/<meta[^>]+property=["']#{property}["'][^>]+content=["']([^"']+)["']/i
    case Regex.run(pattern, html) do
      [_, content] -> content
      _ -> nil
    end
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
