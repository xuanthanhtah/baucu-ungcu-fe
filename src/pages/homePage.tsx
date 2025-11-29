import { useEffect, useMemo, useState } from "react";
import {
  Button,
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
  Select,
} from "antd";
import { supabase } from "../supabaseClient";

type Voter = {
  name: string;
  votes: number;
};

export default function HomePage(): JSX.Element {
  const [selectedNames, setSelectedNames] = useState<string[]>([]);
  const [candidates, setCandidates] = useState<string[]>([]);
  const [users, setUsers] = useState<{ id: number; name: string }[]>([]);
  const [currentUser, setCurrentUser] = useState<number | null>(null);
  const [data, setData] = useState<Voter[]>([]);
  const [maxLanNhap, setMaxLanNhap] = useState<number>(0);

  // Fetch candidates and users list
  useEffect(() => {
    async function fetchData() {
      // Fetch candidates
      const { data: ung_vien, error: err1 } = await supabase
        .from("ung_vien")
        .select("*");

      if (err1) {
        console.error("Error fetching candidates:", err1);
        message.error("Không thể tải danh sách ứng viên");
      } else if (ung_vien) {
        setCandidates(ung_vien.map((uv: any) => uv.ten_uv));
      }

      // Fetch users
      const { data: user_nhap, error: err2 } = await supabase
        .from("user_nhap")
        .select("*");

      if (err2) {
        console.error("Error fetching users:", err2);
        message.error("Không thể tải danh sách người nhập");
      } else if (user_nhap) {
        setUsers(
          user_nhap.map((u: any) => ({ id: u.id, name: u.ten_user_nhap }))
        );
      }
    }

    fetchData();
  }, []);

  // Fetch votes data
  const fetchVotes = async () => {
    const { data: list, error } = await supabase.from("danh_sach").select("*");

    if (error) {
      console.error("Error fetching votes:", error);
      return;
    }

    if (list) {
      // Aggregate votes by candidate name
      const agg: Record<string, number> = {};
      list.forEach((item: any) => {
        agg[item.ung_vien] = (agg[item.ung_vien] || 0) + item.so_phieu;
      });

      const result = Object.keys(agg).map((name) => ({
        name,
        votes: agg[name],
      }));
      setData(result);

      // Get max lan_nhap
      const { data: maxData } = await supabase
        .from("danh_sach")
        .select("lan_nhap")
        .order("lan_nhap", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (maxData) {
        setMaxLanNhap(maxData.lan_nhap);
      } else {
        setMaxLanNhap(0);
      }
    }
  };

  useEffect(() => {
    fetchVotes();
  }, []);

  const totalVoters = useMemo(() => data.length, [data]);
  const totalVotes = useMemo(
    () => data.reduce((s, item) => s + (item.votes || 0), 0),
    [data]
  );

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => (b.votes || 0) - (a.votes || 0));
  }, [data]);

  async function handleSave() {
    if (!currentUser) {
      message.warning("Vui lòng chọn người nhập liệu");
      return;
    }

    // Lọc ra những người KHÔNG được chọn (những người còn lại)
    const remainingNames = candidates.filter((c) => !selectedNames.includes(c));

    if (remainingNames.length === 0) {
      message.warning("Bạn đã loại bỏ tất cả ứng viên");
      return;
    }

    try {
      // Get the latest lan_nhap
      const { data: latestEntry, error: latestError } = await supabase
        .from("danh_sach")
        .select("lan_nhap")
        .order("lan_nhap", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestError) {
        console.error("Error fetching latest lan_nhap:", latestError);
        message.error("Lỗi khi lấy lần nhập mới nhất");
        return;
      }

      const nextLanNhap = (latestEntry?.lan_nhap || 0) + 1;

      const inserts = remainingNames.map((name) => ({
        user_nhap: currentUser,
        ung_vien: name,
        so_phieu: 1,
        lan_nhap: nextLanNhap,
      }));

      const { error } = await supabase.from("danh_sach").insert(inserts);

      if (error) throw error;

      message.success(
        `Đã thêm phiếu cho ${remainingNames.length} người (đã loại ${selectedNames.length}) - Lần nhập: ${nextLanNhap}`
      );
      setSelectedNames([]);
      fetchVotes();
    } catch (err) {
      console.error("Error saving votes:", err);
      message.error("Lỗi khi lưu phiếu bầu");
    }
  }

  async function updateVote(record: Voter, delta: number) {
    if (!currentUser) {
      message.warning(
        "Vui lòng chọn người nhập liệu để thực hiện hành động này"
      );
      return;
    }

    try {
      // Find the record for this user and candidate
      const { data: existing, error } = await supabase
        .from("danh_sach")
        .select("*")
        .eq("user_nhap", currentUser)
        .eq("ung_vien", record.name)
        .maybeSingle();

      if (error) throw error;

      if (existing) {
        const newVotes = Math.max(0, existing.so_phieu + delta);
        await supabase
          .from("danh_sach")
          .update({ so_phieu: newVotes })
          .eq("id", existing.id);
      } else {
        if (delta > 0) {
          await supabase.from("danh_sach").insert([
            {
              user_nhap: currentUser,
              ung_vien: record.name,
              so_phieu: delta,
            },
          ]);
        }
      }
      message.success(`Đã cập nhật phiếu cho ${record.name}`);
      fetchVotes();
    } catch (err) {
      console.error("Error updating vote:", err);
      message.error("Lỗi cập nhật phiếu");
    }
  }

  async function deleteCandidate(name: string) {
    try {
      // Delete all records for this candidate (global delete)
      const { error } = await supabase
        .from("danh_sach")
        .delete()
        .eq("ung_vien", name);

      if (error) throw error;

      message.info(`${name} đã bị xóa`);
      fetchVotes();
    } catch (err) {
      console.error("Error deleting candidate:", err);
      message.error("Lỗi xóa ứng viên");
    }
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
          <Button size="small" onClick={() => updateVote(record, -1)}>
            -1
          </Button>

          <Button size="small" onClick={() => updateVote(record, 1)}>
            +1
          </Button>

          <Popconfirm
            title={`Xóa "${record.name}" khỏi danh sách?`}
            onConfirm={() => deleteCandidate(record.name)}
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

  async function handleUndo() {
    if (!currentUser) {
      message.warning("Vui lòng chọn người nhập liệu để hoàn tác");
      return;
    }

    try {
      // Find the latest lan_nhap for this user
      const { data: latestEntry, error: latestError } = await supabase
        .from("danh_sach")
        .select("lan_nhap")
        .eq("user_nhap", currentUser)
        .order("lan_nhap", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestError) {
        console.error("Error fetching latest lan_nhap:", latestError);
        message.error("Lỗi khi lấy lần nhập mới nhất");
        return;
      }

      if (!latestEntry) {
        message.info("Không có dữ liệu để hoàn tác cho người dùng này");
        return;
      }

      const latestLanNhap = latestEntry.lan_nhap;

      Modal.confirm({
        title: "Xác nhận hoàn tác",
        content: `Bạn có chắc chắn muốn xóa lần nhập thứ ${latestLanNhap} của người dùng này không?`,
        okText: "Hoàn tác",
        okButtonProps: { danger: true },
        cancelText: "Hủy",
        onOk: async () => {
          try {
            const { error } = await supabase
              .from("danh_sach")
              .delete()
              .eq("user_nhap", currentUser)
              .eq("lan_nhap", latestLanNhap);

            if (error) throw error;

            message.success(`Đã hoàn tác lần nhập thứ ${latestLanNhap}`);
            fetchVotes();
          } catch (err) {
            console.error("Error undoing:", err);
            message.error("Lỗi khi hoàn tác");
          }
        },
      });
    } catch (err) {
      console.error("Error in handleUndo:", err);
      message.error("Lỗi hệ thống");
    }
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
                <Select
                  style={{ width: 200 }}
                  placeholder="Chọn người nhập liệu"
                  value={currentUser || undefined}
                  onChange={setCurrentUser}
                  options={users.map((u) => ({ label: u.name, value: u.id }))}
                />
                <Button onClick={handleUndo} danger>
                  Undo
                </Button>
              </Space>
            </Col>
          </Row>

          <Divider />

          <Row gutter={12} className="mb-4">
            <Col span={6}>
              <Statistic title="Số người" value={totalVoters} />
            </Col>
            <Col span={6}>
              <Statistic title="Tổng số phiếu" value={totalVotes} />
            </Col>
            <Col span={6}>
              <Statistic title="Tổng số lần nhập" value={maxLanNhap} />
            </Col>
            <Col span={6}>
              <Statistic
                title="Người dẫn đầu"
                value={sortedData[0] ? sortedData[0].name : "—"}
              />
            </Col>
          </Row>

          <Row className="mb-4">
            <Col span={24}>
              <div className="mb-2 font-medium">
                Chọn người để GẠCH TÊN (những người còn lại sẽ được bầu):
              </div>
              <div className="grid grid-cols-5 gap-4 mb-4">
                {candidates.map((name) => {
                  const isSelected = selectedNames.includes(name);
                  return (
                    <div
                      key={name}
                      onClick={() => {
                        setSelectedNames((prev) =>
                          prev.includes(name)
                            ? prev.filter((n) => n !== name)
                            : [...prev, name]
                        );
                      }}
                      className={`
                        cursor-pointer border rounded p-4 text-center transition-all select-none
                        ${
                          isSelected
                            ? "bg-red-50 border-red-500 text-red-500 line-through opacity-60"
                            : "bg-white border-gray-200 hover:border-blue-500 hover:shadow-sm"
                        }
                      `}
                    >
                      {name}
                    </div>
                  );
                })}
              </div>

              <Button type="primary" block size="large" onClick={handleSave}>
                Lưu phiếu bầu
              </Button>
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
