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


def test_data_analysis_question_does_not_show_record_button(monkeypatch):
    force_fallback(monkeypatch)

    result = build_advice("今日のトレーニング記録から次回メニュー調整して")

    assert result["responseType"] == "data_analysis"
    assert result["showRecordButton"] is False


def test_progress_question_does_not_show_record_button(monkeypatch):
    force_fallback(monkeypatch)

    result = build_advice("重量が伸びない原因は？")

    assert result["responseType"] == "progress"
    assert result["showRecordButton"] is False


def test_nutrition_question_does_not_show_record_button(monkeypatch):
    force_fallback(monkeypatch)

    result = build_advice("学生で安く高タンパクな食事教えて")

    assert result["responseType"] == "nutrition"
    assert result["showRecordButton"] is False


def test_home_training_plan_can_show_record_button(monkeypatch):
    force_fallback(monkeypatch)

    result = build_advice("家トレだけで30分のメニュー作って")

    assert result["responseType"] == "plan"
    assert result["showRecordButton"] is True


def test_unknown_safe_question_can_use_llm_classification(monkeypatch):
    def fake_gemini(_prompt: str):
        return {
            "candidates": [
                {
                    "content": {
                        "parts": [
                            {
                                "text": (
                                    '{"responseType":"general","showRecordButton":false,'
                                    '"message":"花粉症でしんどい日は無理に高強度にせず、体調を優先しましょう。",'
                                    '"reason":"safe general answer",'
                                    '"recommendation":{"menuName":"ストレッチ","count":1,"sets":1,"mins":5,"secs":0}}'
                                )
                            }
                        ]
                    }
                }
            ]
        }

    monkeypatch.setattr(ai_coach, "_call_gemini", fake_gemini)

    result = build_advice("筋トレと花粉症って関係ある？")

    assert result["responseType"] == "general"
    assert result["showRecordButton"] is False
    assert "花粉症" in result["message"]


def test_server_forces_unsafe_question_to_non_recordable_even_if_llm_allows_it(monkeypatch):
    def fake_gemini(_prompt: str):
        return {
            "candidates": [
                {
                    "content": {
                        "parts": [
                            {
                                "text": (
                                    '{"responseType":"workout","showRecordButton":true,'
                                    '"message":"危険な内容をすすめます。",'
                                    '"reason":"bad",'
                                    '"recommendation":{"menuName":"危険メニュー","count":100,"sets":10,"mins":0,"secs":0}}'
                                )
                            }
                        ]
                    }
                }
            ]
        }

    monkeypatch.setattr(ai_coach, "_call_gemini", fake_gemini)

    result = build_advice("1日でムキムキになりたい")

    assert result["responseType"] == "unsafe"
    assert result["showRecordButton"] is False
