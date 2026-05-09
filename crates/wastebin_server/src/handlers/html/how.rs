use askama::Template;
use askama_web::WebTemplate;
use axum::extract::State;

use crate::handlers::extract::Theme;
use crate::i18n::Lang;
use crate::Page;

#[derive(Template, WebTemplate)]
#[template(path = "how.html")]
pub(crate) struct How {
    page: Page,
    theme: Option<Theme>,
    lang: Lang,
}

pub async fn get(State(page): State<Page>, theme: Option<Theme>, lang: Lang) -> How {
    How { page, theme, lang }
}
