pub fn get_chat_interface_template() -> &'static str {
    include_str!("../templates/chat.html")
}

pub fn get_db_viewer_template() -> &'static str {
    include_str!("../templates/db_viewer.html")
}

pub fn get_app_renderer_prompt() -> &'static str {
    include_str!("../prompts/app-renderer.txt")
}