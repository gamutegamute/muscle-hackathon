from app.services import ai_coach


def force_fallback(monkeypatch):
    def raise_error(_prompt: str):
        raise RuntimeError("offline")

    monkeypatch.setattr(ai_coach, "_call_gemini", raise_error)


def build_advice(text: str):
    return ai_coach.build_ai_advice(
        user_name="テスト",
        level="初心者（これから始める）",
        topic=text,
        message=text,
        records=[],
    )


def test_shoulder_request_returns_shoulder_menu(monkeypatch):
    force_fallback(monkeypatch)

    result = build_advice("肩のトレーニングがしたい")

    assert result["responseType"] == "body_part"
    assert result["showRecordButton"] is True
    assert result["recommendation"]["menuName"] == "サイドレイズ"
    assert "肩" in result["message"]


def test_app_info_does_not_show_record_button(monkeypatch):
    force_fallback(monkeypatch)

    result = build_advice("このアプリは何ができますか？")

    assert result["responseType"] == "app_info"
    assert result["showRecordButton"] is False
    assert "muscloop" in result["message"]


def test_form_request_is_not_misclassified_as_motivation(monkeypatch):
    force_fallback(monkeypatch)

    result = build_advice("フォームが不安")

    assert result["responseType"] == "form"
    assert result["showRecordButton"] is False
    assert "フォーム" in result["message"]


def test_pushup_howto_does_not_show_record_button_even_if_llm_suggests_menu(monkeypatch):
    def fake_gemini(_prompt: str):
        return {
            "candidates": [
                {
                    "content": {
                        "parts": [
                            {
                                "text": (
                                    '{"responseType":"workout","showRecordButton":true,'
                                    '"message":"腕立てをしましょう",'
                                    '"reason":"test",'
                                    '"recommendation":{"menuName":"プッシュアップ","count":10,"sets":3,"mins":0,"secs":0}}'
                                )
                            }
                        ]
                    }
                }
            ]
        }

    monkeypatch.setattr(ai_coach, "_call_gemini", fake_gemini)

    result = build_advice("いい腕立ての方法ある？")

    assert result["responseType"] == "form"
    assert result["showRecordButton"] is False


def test_casual_appearance_question_does_not_show_record_button(monkeypatch):
    def fake_gemini(_prompt: str):
        return {
            "candidates": [
                {
                    "content": {
                        "parts": [
                            {
                                "text": (
                                    '{"responseType":"workout","showRecordButton":true,'
                                    '"message":"チンニングをしましょう",'
                                    '"reason":"test",'
                                    '"recommendation":{"menuName":"チンニング","count":8,"sets":3,"mins":0,"secs":0}}'
                                )
                            }
                        ]
                    }
                }
            ]
        }

    monkeypatch.setattr(ai_coach, "_call_gemini", fake_gemini)

    result = build_advice("どの部位を鍛えたらモテると思う？")

    assert result["responseType"] == "general"
    assert result["showRecordButton"] is False


def test_injury_question_is_safety_first(monkeypatch):
    force_fallback(monkeypatch)

    result = build_advice("膝が痛いときはどうする？")

    assert result["responseType"] == "injury"
    assert result["showRecordButton"] is False
    assert "断定" in result["message"] or "専門家" in result["message"]


def test_privacy_question_does_not_show_record_button(monkeypatch):
    force_fallback(monkeypatch)

    result = build_advice("体重はフレンドに見える？")

    assert result["responseType"] == "privacy"
    assert result["showRecordButton"] is False
    assert "公開" in result["message"]


def test_unsafe_extreme_request_is_declined(monkeypatch):
    force_fallback(monkeypatch)

    result = build_advice("1日でムキムキになりたい")

    assert result["responseType"] == "unsafe"
    assert result["showRecordButton"] is False
    assert "おすすめできません" in result["message"]


def test_supplement_question_does_not_show_record_button(monkeypatch):
    force_fallback(monkeypatch)

    result = build_advice("クレアチンって効果ある？")

    assert result["responseType"] == "supplement"
    assert result["showRecordButton"] is False


def test_plan_question_can_show_record_button(monkeypatch):
    force_fallback(monkeypatch)

    result = build_advice("時間30分しかない場合の最適メニューは？")

    assert result["responseType"] == "plan"
    assert result["showRecordButton"] is True


def test_body_fat_goal_question_does_not_show_record_button(monkeypatch):
    force_fallback(monkeypatch)

    result = build_advice("体脂肪率から目標を作って欲しい")

    assert result["responseType"] == "goal_strategy"
    assert result["showRecordButton"] is False
    assert "身長" in result["message"] or "体重" in result["message"]
