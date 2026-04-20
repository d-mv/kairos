defmodule Kairos.Accounts.UserNotifier do
  import Swoosh.Email
  require Logger

  alias Kairos.Mailer
  alias Kairos.Accounts.User

  # Delivers the email using the application mailer.
  defp deliver(recipient, subject, body) do
    from = Application.get_env(:kairos, :mailer_from, "onboarding@resend.dev")

    email =
      new()
      |> to(recipient)
      |> from({"Kairos", from})
      |> subject(subject)
      |> text_body(body)

    Logger.info("Delivering email to=#{recipient} subject=#{subject} from=#{from}")

    case Mailer.deliver(email) do
      {:ok, _metadata} ->
        Logger.info("Email delivered ok to=#{recipient}")
        {:ok, email}

      {:error, reason} = err ->
        Logger.error("Email delivery failed to=#{recipient} reason=#{inspect(reason)}")
        err
    end
  end

  @doc """
  Deliver instructions to update a user email.
  """
  def deliver_update_email_instructions(user, url) do
    deliver(user.email, "Update email instructions", """

    ==============================

    Hi #{user.email},

    You can change your email by visiting the URL below:

    #{url}

    If you didn't request this change, please ignore this.

    ==============================
    """)
  end

  @doc """
  Deliver instructions to log in with a magic link.
  """
  def deliver_login_instructions(user, url) do
    case user do
      %User{confirmed_at: nil} -> deliver_confirmation_instructions(user, url)
      _ -> deliver_magic_link_instructions(user, url)
    end
  end

  defp deliver_magic_link_instructions(user, url) do
    deliver(user.email, "Log in instructions", """

    ==============================

    Hi #{user.email},

    You can log into your account by visiting the URL below:

    #{url}

    If you didn't request this email, please ignore this.

    ==============================
    """)
  end

  defp deliver_confirmation_instructions(user, url) do
    deliver(user.email, "Confirmation instructions", """

    ==============================

    Hi #{user.email},

    You can confirm your account by visiting the URL below:

    #{url}

    If you didn't create an account with us, please ignore this.

    ==============================
    """)
  end
end
