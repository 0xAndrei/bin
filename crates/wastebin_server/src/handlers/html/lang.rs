use askama::Template;
use askama_web::WebTemplate;
use axum::extract::State;

use crate::handlers::extract::Theme;
use crate::i18n::Lang;
use crate::{Highlighter, Page};

/// Page listing supported syntax highlighting language tokens.
#[derive(Template, WebTemplate)]
#[template(path = "lang.html")]
pub(crate) struct Languages {
    page: Page,
    theme: Option<Theme>,
    lang: Lang,
    highlighter: Highlighter,
}

pub async fn get(
    State(page): State<Page>,
    State(highlighter): State<Highlighter>,
    theme: Option<Theme>,
    lang: Lang,
) -> Languages {
    Languages {
        page,
        theme,
        lang,
        highlighter,
    }
}
