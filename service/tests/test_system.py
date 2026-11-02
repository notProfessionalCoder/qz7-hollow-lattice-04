import asyncio

from jarvis_service.plugins.system import NetSample, SystemPlugin, build_alerts, net_rates


def test_net_rates_first_sample_is_zero():
    assert net_rates(None, NetSample(1.0, 100, 200)) == (0.0, 0.0)


def test_net_rates_per_second():
    up, down = net_rates(NetSample(1.0, 100, 1000), NetSample(3.0, 300, 5000))
    assert up == 100.0
    assert down == 2000.0


def test_net_rates_counter_reset_is_not_negative():
    up, down = net_rates(NetSample(1.0, 500, 500), NetSample(2.0, 10, 10))
    assert (up, down) == (0.0, 0.0)


def test_alerts_quiet_when_healthy():
    snap = {
        "cpu": {"percent": 20, "temp_c": None},
        "memory": {"percent": 40},
        "disks": [{"mount": "C:\\", "percent": 50}],
        "gpus": [{"name": "RTX", "temp_c": 55}],
    }
    assert build_alerts(snap) == []


def test_alerts_fire_over_threshold():
    snap = {
        "cpu": {"percent": 97, "temp_c": 95},
        "memory": {"percent": 93},
        "disks": [{"mount": "D:\\", "percent": 99}],
        "gpus": [{"name": "RTX", "temp_c": 88}],
    }
    sources = sorted(a["source"] for a in build_alerts(snap))
    assert sources == ["cpu", "cpu", "disk", "gpu", "memory"]


def test_fetch_shape():
    snap = asyncio.run(SystemPlugin().fetch())
    assert 0 <= snap["cpu"]["percent"] <= 100
    assert snap["memory"]["total"] > 0
    assert isinstance(snap["disks"], list)
    assert isinstance(snap["gpus"], list)  # CI 上没有 N 卡，应为空列表
    assert set(snap["net"]) >= {"up_bps", "down_bps"}
