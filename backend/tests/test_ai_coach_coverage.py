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

