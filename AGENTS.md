<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

- Payment webhook adapters must fail closed until the real provider protocol, amount/currency checks and atomic idempotent accounting are implemented; placeholder callbacks must never approve sales.
- Buyer token reads must remove delivery URLs server-side unless the sale is paid; hiding links in the UI is not authorization.
