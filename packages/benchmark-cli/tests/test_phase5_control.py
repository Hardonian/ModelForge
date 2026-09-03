from typer.testing import CliRunner
from modelforge.cli import app

runner = CliRunner()


def test_control_status_command():
    result = runner.invoke(app, ["control", "--org", "org_enterprise_alpha"])
    assert result.exit_code == 0
    assert "Autonomous Inference Control Plane" in result.stdout
    assert "ONLINE" in result.stdout
    assert "guarded_automation" in result.stdout


def test_control_status_json():
    result = runner.invoke(app, ["control", "--json"])
    assert result.exit_code == 0
    assert '"status": "healthy"' in result.stdout
    assert '"kill_switch_active": false' in result.stdout


def test_action_list_command():
    result = runner.invoke(app, ["action", "list", "--org", "org_enterprise_alpha"])
    assert result.exit_code == 0
    assert "Optimization Actions" in result.stdout
    assert "CANARYING" in result.stdout


def test_action_approve_command():
    result = runner.invoke(app, ["action", "approve", "act-12345", "--approver", "secops_lead"])
    assert result.exit_code == 0
    assert "approved by secops_lead" in result.stdout
    assert "Action hash verified" in result.stdout


def test_action_rollback_command():
    result = runner.invoke(app, ["action", "rollback", "act-12345", "--reason", "P95 latency spike"])
    assert result.exit_code == 0
    assert "Triggering emergency rollback" in result.stdout
    assert "Traffic restored to last known good deployment" in result.stdout


def test_freeze_lifecycle_commands():
    # Activate kill switch
    res_act = runner.invoke(app, ["freeze", "activate", "--reason", "Cluster network partition", "--org", "org_enterprise_alpha"])
    assert res_act.exit_code == 0
    assert "EMERGENCY KILL SWITCH ACTIVATED" in res_act.stdout

    # Lift freeze
    res_lift = runner.invoke(app, ["freeze", "lift", "frz-9999"])
    assert res_lift.exit_code == 0
    assert "Automation freeze frz-9999 lifted" in res_lift.stdout
