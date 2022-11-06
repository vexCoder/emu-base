class Constants {
  static PAL = [
    "Germany",
    "Sweden",
    "Finland",
    "Denmark",
    "Norway",
    "France",
    "Spain",
    "Italy",
    "Netherlands",
    "Belgium",
    "Austria",
    "Europe",
  ];

  static NTSCU = [
    "USA",
    "Europe",
    "Canada",
    "Mexico",
    "Brazil",
    "Argentina",
    "Chile",
  ];

  static NTSCJ = ["Japan", "Korea", "Taiwan"];

  static DEFAULT_CFG: PartialCFG = {
    notification_show_config_override_load: "false",
    notification_show_cheats_applied: "false",
    notification_show_autoconfig: "false",
    notification_show_fast_forward: "false",
    menu_show_load_content: "false",
    menu_show_load_content_animation: "false",
    menu_show_quit_retroarch: "false",
    menu_show_shutdown: "false",
    pause_nonactive: "false",
    input_driver: "dinput",
    video_driver: "d3d12",
    state_slot: "0",
    quit_press_twice: "false",
    input_state_slot_decrease: "f6",
    input_state_slot_increase: "f7",
    input_save_state: "f5",
    input_load_state: "f4",
    input_toggle_fast_forward: "f2",
    input_screenshot: "f1",
    fastforward_ratio: "0.000000",
    menu_pause_libretro: "false",
    audio_enable: "true",
    video_refresh_rate: "144.000000",
    fps_show: "false",
    input_fps_toggle: "f3",
    input_exit_emulator: "f12",
    input_osk_toggle: "nul",
    audio_mute_enable: "false",
    audio_volume: "-8.000000",
    auto_remaps_enable: "false",
    input_player1_joypad_index: "1",
    input_enable_hotkey: "shift",
    video_font_enable: "false",
  };

  static TGDBPlatform = {
    ps1: 10,
    ps2: 11,
    psp: 13,
  };

  static VALID_CHAR_REGEX =
    /([^<>/a-zA-Z0-9-.,'";&()=~[\]?!<>+_*\\|{}@#$%^` \t\n])/g;
}

export default Constants;
