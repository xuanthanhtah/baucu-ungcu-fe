import { useEffect, useMemo, useState } from "react";
import {
  AutoComplete,
  Button,
  Input,
  Space,
  Table,
  message,
  Card,
  Row,
  Col,
  Statistic,
  Popconfirm,
  Modal,
  Divider,
  Empty,
} from "antd";

type Voter = {
  name: string;
  votes: number;
};

const STORAGE_KEY = "voters_list_v1";

export default function HomePage(): JSX.Element {
  const [value, setValue] = useState<string>("");
  const [data, setData] = useState<Voter[]>(() => {
    if (typeof window === "undefined") return [];

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw || raw === "null" || raw === "undefined") return [];

      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.error("Failed to read voters from localStorage", err);
      return [];
    }
  });

  const [options, setOptions] = useState<{ value: string }[]>([]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.error("Failed to save voters to localStorage", err);
    }
  }, [data]);

  const names = useMemo(() => data.map((d) => d.name), [data]);

  const totalVoters = useMemo(() => data.length, [data]);
  const totalVotes = useMemo(
    () => data.reduce((s, item) => s + (item.votes || 0), 0),
    [data]
  );

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => (b.votes || 0) - (a.votes || 0));
  }, [data]);

  function handleSave() {
    const name = value.trim();
    if (!name) {
      message.warning("Vui lòng nhập tên");
      return;
    }

    setData((prev) => {
      const idx = prev.findIndex(
        (p) => p.name.toLowerCase() === name.toLowerCase()
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], votes: next[idx].votes + 1 };
        message.success(`Cập nhật ${name}: +1 phiếu`);
        return next;
      }

      const next = [...prev, { name, votes: 1 }];
      message.success(`Thêm ${name} với 1 phiếu`);
      return next;
    });

    setValue("");
  }

  function handleSearch(searchText: string) {
    if (!searchText) {
      setOptions([]);
      return;
    }
    const q = searchText.toLowerCase();
    const matched = names
      .filter((n) => n.toLowerCase().includes(q))
      .slice(0, 10)
      .map((v) => ({ value: v }));
    setOptions(matched);
  }

  const columns = [
    {
      title: "STT",
      dataIndex: "index",
      key: "index",
      width: 80,
      render: (_: any, __: any, idx: number) => idx + 1,
    },
    {
      title: "Tên",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Số lượng phiếu",
      dataIndex: "votes",
      key: "votes",
      width: 140,
    },
    {
      title: "Hành động",
      key: "actions",
      width: 180,
      render: (_: any, record: Voter) => (
        <Space>
          <Button
            size="small"
            onClick={() => {
              // giảm 1 phiếu cho bản ghi này (không âm)
              setData((prev) =>
                prev.map((p) =>
                  p.name === record.name
                    ? { ...p, votes: Math.max(0, p.votes - 1) }
                    : p
                )
              );
              message.success(`${record.name}: -1 phiếu`);
            }}
          >
            -1
          </Button>

          <Button
            size="small"
            onClick={() => {
              // thêm 1 phiếu cho bản ghi này
              setData((prev) =>
                prev.map((p) =>
                  p.name === record.name ? { ...p, votes: p.votes + 1 } : p
                )
              );
              message.success(`${record.name}: +1 phiếu`);
            }}
          >
            +1
          </Button>

          <Popconfirm
            title={`Xóa "${record.name}" khỏi danh sách?`}
            onConfirm={() => {
              setData((prev) => prev.filter((p) => p.name !== record.name));
              message.info(`${record.name} đã bị xóa`);
            }}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button size="small" danger>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  function confirmReset() {
    Modal.confirm({
      title: "Xác nhận xóa toàn bộ dữ liệu",
      content: "Hành động này sẽ xóa toàn bộ danh sách và không thể hoàn tác.",
      okText: "Xóa tất cả",
      okButtonProps: { danger: true },
      cancelText: "Hủy",
      onOk() {
        setData([]);
        message.success("Đã xóa toàn bộ dữ liệu");
      },
    });
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex items-start justify-center">
      <div className="w-full max-w-4xl">
        <Card className="mb-6">
          <Row gutter={16} className="items-center">
            <Col flex="auto">
              <h1 className="text-2xl font-semibold">Quản lý phiếu bầu</h1>
            </Col>

            <Col>
              <Space>
                <Button onClick={confirmReset} danger>
                  Reset
                </Button>
              </Space>
            </Col>
          </Row>

          <Divider />

          <Row gutter={12} className="mb-4">
            <Col span={8}>
              <Statistic title="Số người" value={totalVoters} />
            </Col>
            <Col span={8}>
              <Statistic title="Tổng số phiếu" value={totalVotes} />
            </Col>
            <Col span={8}>
              <Statistic
                title="Người dẫn đầu"
                value={sortedData[0] ? sortedData[0].name : "—"}
              />
            </Col>
          </Row>

          <Row className="mb-4">
            <Col span={24}>
              <Space className="w-full" direction="horizontal">
                <AutoComplete
                  value={value}
                  options={options}
                  onSelect={(val) => setValue(val)}
                  onSearch={handleSearch}
                  filterOption={false}
                  style={{ width: "300px" }}
                >
                  <Input
                    placeholder="Nhập tên và nhấn Enter hoặc nhấn Lưu"
                    onChange={(e) => setValue(e.target.value)}
                    onPressEnter={handleSave}
                    value={value}
                    autoFocus
                    allowClear
                  />
                </AutoComplete>

                <div className="flex justify-end">
                  <Button type="primary" onClick={handleSave}>
                    Lưu
                  </Button>
                </div>
              </Space>
            </Col>
          </Row>
        </Card>

        <Card>
          {sortedData.length === 0 ? (
            <div className="py-12">
              <Empty description="Chưa có dữ liệu" />
            </div>
          ) : (
            <Table<Voter>
              columns={columns}
              dataSource={sortedData}
              rowKey={(record) => record.name}
              pagination={false}
            />
          )}
        </Card>
      </div>
    </div>
  );
}
