import { useState, useEffect } from 'react';
import { request } from 'umi';
import {
  Input,
  Select,
  Radio,
  Button,
  Table,
  Descriptions,
  Modal,
  Form,
  Popconfirm,
  Tag,
  message,
  Tooltip,
  InputNumber,
  Pagination,
} from 'antd';
import {
  CopyOutlined,
  DeleteOutlined,
  AppstoreAddOutlined,
  DesktopOutlined,
} from '@ant-design/icons';
import moment from 'moment';
import { parse } from 'qs';
import { info, updateOptions } from '../../../mock/data';
import CodeEditor from '@/components/codeEditor';
import styles from './index.less';

const { Search } = Input;
const comsKeys = {
  select: Select,
  json: CodeEditor,
  input: Input,
  InputNumber: InputNumber,
};
const getPageMax = (link: string) => {
  const linkMap = link.split(';');
  let pageMax = 1;
  if (linkMap.length) {
    const lastRel = linkMap[linkMap.length - 2];
    let [, apiLink] = lastRel.split(',');
    apiLink = apiLink.replace('</', '').replace('>', '');
    const [, paramString] = apiLink.split('?');
    const param = parse(paramString.replace(/^\?/, ''));
    pageMax = param.page;
  }
  return pageMax;
};

// scheduler
export default function IndexPage() {
  // scheduler clusters
  const [sClusters, setClusters] = useState([]);
  // seed peer clusters
  const [seedPeerClusters, setSeedPeerClusters] = useState([]);
  // security groups
  const [secGroups, setGroup] = useState([]);
  // cluster item status
  const [isClick, setClick] = useState(0);
  const [isHover, setHover] = useState(0);

  const [scheduler, setSchedulers] = useState([]);
  // cluster选择树分页
  const [current, setCurrent] = useState(1);
  const [clusterTotal, setClusterTotal] = useState(0);
  const [searchCluster, setSearchCluster] = useState('');

  // dialog title
  const [dTitle, setDTitle] = useState('');
  // json dialog visible
  const [visible, setVisible] = useState(false);
  // form dialog visible
  const [formVisible, setFormVisible] = useState(false);
  const [updateVisible, setUpdateVisible] = useState(false);
  // form dialog content
  const [formInfo, setFormInfo] = useState<any>({});
  // form dialog schema
  const [formSchema, setFormSchema] = useState(info);
  // json dialog content
  const [json, setJson] = useState('');
  const [updateInfo, setUpdateInfo] = useState({});

  const [copyVisible, setCopyVisible] = useState(false);

  const formOps = {
    seed_peer_cluster_id: seedPeerClusters,
    security_group_id: secGroups,
  };

  useEffect(() => {
    init();
  }, [current]);

  const init = () => {
    getClusters();
    getSeedPeerClusters();
    getSecGroups();
  };

  const getSchedulerByClusterId = async (id: string | number, v: number) => {
    const res = await request('/api/v1/schedulers', {
      params: {
        page: v,
        per_page: 50,
        scheduler_cluster_id: id,
      },
    });
    if (res && typeof res === 'object') {
      setSchedulers(
        res.map((sub) => {
          return {
            ...sub,
            key: sub.id,
          };
        }),
      );
    }
  };

  const updateSchedulerById = (id: number, config: any) => {
    const res = request(`/api/v1/schedulers/${id}`, {
      method: 'patch',
      data: config,
    });
    res.then((e) => {
      message.success('Update Success');
      setVisible(false);
      getSchedulerByClusterId(sClusters[isClick]?.id, 1);
    });
  };

  const deleteSchedulerById = (id: string) => {
    const res = request(`/api/v1/schedulers/${id}`, {
      method: 'delete',
    });
    res.then((v) => {
      message.success('Delete Success');
      getSchedulerByClusterId(sClusters[isClick]?.id, 1);
    });
  };

  const getClusters = async () => {
    const res = await request('/api/v1/scheduler-clusters', {
      method: 'get',
      getResponse: true, // 获取response信息
      params: { page: current, per_page: 50, name: searchCluster },
    });

    const data = res.data || [];
    const headerLink = res.response.headers.get('Link') || '';
    const pageMax = getPageMax(headerLink);
    const total = pageMax * 50;

    if (data && typeof data === 'object' && data.length > 0) {
      // number to string
      data.map((sub: any) => {
        Object.keys(sub).forEach((el) => {
          if (typeof sub[el] === 'number') {
            sub[el] = sub[el].toString();
          }
          // let temp_cluster: any[] = [];
          // if (typeof sub['seed_peer_clusters'] === 'object') {
          //   (sub['seed_peer_clusters'] || []).forEach((cluster: any) => {
          //     temp_cluster.push(cluster.id || cluster || '');
          //   }) || [];
          // } else {
          //   temp_cluster = sub['seed_peer_clusters'];
          // }
          // // console.log(sub['seed_peer_clusters'], temp_cluster);
          // sub['seed_peer_clusters'] = Number(temp_cluster.toString());
          // sub['seed_peer_cluster_id'] = Number(temp_cluster.toString());
          sub['created_at'] = moment(
            new Date(sub['created_at']).valueOf(),
          ).format('YYYY-MM-DD HH:MM:SS');
          sub['updated_at'] = moment(
            new Date(sub['updated_at']).valueOf(),
          ).format('YYYY-MM-DD HH:MM:SS');
        });
      });

      // console.log(data);
      getSchedulerByClusterId(data[0].id, 1);
      data[0].security_group_id = Number(data[0].security_group_id);
      if (data[0].seed_peer_clusters.length > 0) {
        data[0].seed_peer_cluster_id = data[0].seed_peer_clusters[0].id;
      } else {
        data[0].seed_peer_cluster_id = 0;
      }
    }
    setClusters(data);
    setClusterTotal(total);
  };

  const getSeedPeerClusters = async () => {
    const res = await request('/api/v1/seed-peer-clusters');
    if (res && res.length > 0) {
      setSeedPeerClusters(
        res.map((el: any) => {
          return {
            ...el,
            label: el.name,
            value: el.id,
          };
        }),
      );
    }
  };

  const getSecGroups = async () => {
    const res = await request('/api/v1/security-groups');
    if (res && res.length > 0) {
      setGroup(
        res.map((el: any) => {
          return {
            label: el.name,
            value: el.id,
          };
        }),
      );
    }
  };

  const createClusters = (config: any) => {
    const res = request('/api/v1/scheduler-clusters', {
      method: 'post',
      data: config,
    });
    res.then((r) => {
      message.success('Create Success');
      setCopyVisible(false);
      setFormVisible(false);
      setUpdateInfo({});
      setFormSchema(info);
      setFormInfo({});
      getClusters();
    });
    setJson('');
  };

  const updateClusterById = (config: any) => {
    const res = request(`/api/v1/scheduler-clusters/${config.id}`, {
      method: 'patch',
      data: config,
    });
    res.then((r) => {
      message.success('Update Success');
      setFormSchema(info);
      setFormVisible(false);
      getClusters();
    });
  };

  const deleteClusterById = (id: number) => {
    const res = request(`/api/v1/scheduler-clusters/${id}`, {
      method: 'delete',
    });
    res
      .then((r) => {
        message.success('Delete Success');
        getClusters();
      })
      .catch((v) => {});
  };

  const columns = [
    {
      title: 'Hostname',
      dataIndex: 'host_name',
      align: 'left',
      key: 'host_name',
      ellipsis: true,
      render: (v: string) => {
        return (
          <Tooltip title={v}>
            <div className={styles.tableItem}>{v}</div>
          </Tooltip>
        );
      },
    },
    {
      title: 'IP',
      dataIndex: 'ip',
      align: 'left',
      key: 'ip',
      ellipsis: true,
      render: (v: string) => {
        return (
          <Tooltip title={v}>
            <Button
              type={location.origin.includes('alibaba') ? 'link' : 'text'}
              onClick={() => {
                if (location.origin.includes('alibaba')) {
                  window.open(
                    `https://sa.alibaba-inc.com/ops/terminal.html?ip=${v}`,
                  );
                }
              }}
              style={{
                overflow: 'auto',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              <DesktopOutlined />
              {v || '-'}
            </Button>
          </Tooltip>
        );
      },
    },
    {
      title: 'Net Topology',
      dataIndex: 'net_topology',
      align: 'left',
      key: 'net_topology',
      render: (v: string) => {
        return (
          <Tooltip title={v}>
            <div className={styles.tableItem}>{v || '-'}</div>
          </Tooltip>
        );
      },
    },
    {
      title: 'Location',
      dataIndex: 'location',
      align: 'left',
      key: 'location',
      render: (v: string) => {
        return (
          <Tooltip title={v}>
            <div className={styles.tableItem}>{v || '-'}</div>
          </Tooltip>
        );
      },
    },
    {
      title: 'IDC',
      dataIndex: 'idc',
      align: 'left',
      key: 'idc',
      width: 90,
      ellipsis: true,
      render: (v: string) => {
        return (
          <Tooltip title={v}>
            <div className={styles.tableItem}>{v || '-'}</div>
          </Tooltip>
        );
      },
    },
    {
      title: 'Port',
      dataIndex: 'port',
      align: 'left',
      key: 'port',
      width: 80,
      ellipsis: true,
      render: (v: number) => {
        return (
          <Tooltip title={v}>
            <div className={styles.tableItem}>{v || '-'}</div>
          </Tooltip>
        );
      },
    },
    {
      title: 'State',
      dataIndex: 'state',
      align: 'left',
      key: 'state',
      width: 120,
      render: (v: string) => {
        return (
          <Tag color={v === 'active' ? 'green' : 'cyan'}>
            {v.toUpperCase() || '-'}
          </Tag>
        );
      },
    },
    {
      title: 'Operation',
      dataIndex: 'id',
      align: 'left',
      width: 140,
      key: 'id',
      render: (t: number | string, r: any, i: number) => {
        return (
          <div className={styles.operation}>
            <Popconfirm
              title="Are you sure to delete this Scheduler?"
              onConfirm={() => {
                deleteSchedulerById(t);
              }}
              okText="Yes"
              cancelText="No"
            >
              <Button type="link" className={styles.newBtn}>
                Delete
              </Button>
            </Popconfirm>
          </div>
        );
      },
    },
  ];

  return (
    <div className={styles.main}>
      <h1 className={styles.title}>Scheduler Cluster</h1>
      <div className={styles.content}>
        <div className={styles.left}>
          <Search
            placeholder={'Please Enter Name'}
            style={{
              width: 180,
              marginBottom: 12,
            }}
            value={searchCluster}
            onChange={(e: any) => {
              setSearchCluster(e.target.value);
            }}
            onSearch={(v) => {
              if (current === 1) {
                init();
              } else {
                setCurrent(1);
              }
            }}
          />
          <div className={styles.btnGroup}>
            <Button
              className={styles.newBtn}
              type="text"
              style={{
                marginRight: 8,
                fontSize: 12,
              }}
              onClick={() => {
                setFormSchema(info);
                setFormVisible(true);
                setDTitle('Add Cluster');
                setTimeout(() => {
                  setUpdateVisible(true);
                }, 50);
              }}
            >
              <AppstoreAddOutlined />
              Add Cluster
            </Button>
          </div>
          <div className={styles.clusters}>
            {sClusters.map((sub: any, idx: number) => {
              return (
                <Tooltip title={sub.name}>
                  <div
                    key={sub.id}
                    onClick={() => {
                      setClick(idx);
                      setFormSchema(info);
                      getSchedulerByClusterId(sub.id, 1);
                    }}
                    onMouseEnter={() => {
                      setHover(sub.id);
                    }}
                    onMouseLeave={() => {
                      setHover(0);
                    }}
                    style={{
                      position: 'relative',
                      width: '100%',
                      margin: 0,
                      height: 32,
                      lineHeight: '32px',
                      cursor: 'pointer',
                    }}
                  >
                    <div
                      className={styles.checkLabel}
                      style={{
                        background:
                          isClick === idx ? '#EBF7F1' : 'transparent',
                        color:
                          isClick === idx ? '#23B066' : 'rgba(0, 0, 0, 0.85)',
                      }}
                    >
                      {sub.name}
                    </div>
                    {isHover === sub.id ? (
                      <div className={styles.activeButton}>
                        <Popconfirm
                          title="Are you sure to Copy this Scheduler Cluster?"
                          onConfirm={() => {
                            setUpdateInfo(sub);
                            setCopyVisible(true);
                          }}
                          okText="Yes"
                          cancelText="No"
                        >
                          <Button
                            type="text"
                            className={styles.newBtn}
                            style={{
                              marginRight: 4,
                            }}
                          >
                            <CopyOutlined />
                          </Button>
                        </Popconfirm>
                        <Popconfirm
                          title="Are you sure to delete this Scheduler Cluster?"
                          onConfirm={() => {
                            deleteClusterById(sub.id);
                          }}
                          okText="Yes"
                          cancelText="No"
                        >
                          <Button type="text" className={styles.newBtn}>
                            <DeleteOutlined />
                          </Button>
                        </Popconfirm>
                      </div>
                    ) : (
                      <div />
                    )}
                  </div>
                </Tooltip>
              );
            })}
            <div className={styles.pagination}>
              <Pagination
                size="small"
                current={current}
                defaultPageSize={50}
                showSizeChanger={false}
                hideOnSinglePage={true} // 只有一页时隐藏分页器
                total={clusterTotal}
                onChange={(v: number) => {
                  setCurrent(v);
                }}
              />
            </div>
          </div>
        </div>
        <div className={styles.right}>
          <Descriptions
            title="Cluster Info"
            column={{ xxl: 4, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }}
            extra={
              <Button
                type="primary"
                size="small"
                onClick={() => {
                  setDTitle('Update Cluster');
                  const temp: any = [];
                  const source = sClusters[isClick] || {};

                  info.map((sub: any) => {
                    if (sub.key === 'id' || sub.key === 'name') {
                      sub = {
                        ...sub,
                        hide: false,
                        props: {
                          ...sub.props,
                          disabled: true,
                        },
                      };
                    }

                    if (sub.parent) {
                      sub = {
                        ...sub,
                        formprops: {
                          ...sub.formprops,
                          initialValue:
                            (source[sub.parent] || {})[sub.key] || undefined,
                        },
                      };
                    } else {
                      sub = {
                        ...sub,
                        formprops: {
                          ...sub.formprops,
                          initialValue: source[sub.key] || undefined,
                        },
                      };
                    }

                    temp.push(sub);
                  });

                  setFormInfo(source);
                  setFormSchema(temp);
                  setFormVisible(true);
                  setTimeout(() => {
                    setUpdateVisible(true);
                  }, 50);
                }}
              >
                Update
              </Button>
            }
          >
            {info.map((sub: any, idx: number) => {
              const source = sClusters[isClick] || {};
              if (sub.title) return null;

              return (
                <Descriptions.Item
                  label={
                    <Tooltip title={sub.en_US}>
                      <div
                        style={{
                          width: '90%',
                          textOverflow: 'ellipsis',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {sub.en_US}
                      </div>
                    </Tooltip>
                  }
                  key={idx}
                  labelStyle={{
                    width: '140px',
                    alignItems: 'center',
                    flex: '0 0 140px',
                  }}
                >
                  {sub.parent ? (
                    <Tooltip title={(source[sub.parent] || {})[sub.key] || '-'}>
                      <div
                        style={{
                          width: '90%',
                          textOverflow: 'ellipsis',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {(source[sub.parent] || {})[sub.key] || '-'}
                      </div>
                    </Tooltip>
                  ) : (
                    <Tooltip
                      title={
                        sub.key === 'seed_peer_cluster_id'
                          ? (source['seed_peer_clusters'] || [])[0]?.name || '-'
                          : (source || {})[sub.key] || '-'
                      }
                    >
                      <div
                        style={{
                          width: '90%',
                          textOverflow: 'ellipsis',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {sub.key === 'seed_peer_cluster_id'
                          ? (source['seed_peer_clusters'] || [])[0]?.name || '-'
                          : (source || {})[sub.key] || '-'}
                      </div>
                    </Tooltip>
                  )}
                </Descriptions.Item>
              );
            })}
          </Descriptions>
          <div className={styles.divideLine} />
          <div className={styles.infoTitle}>Scheduler</div>
          <Table
            dataSource={scheduler}
            columns={columns}
            primaryKey="name"
            pagination={{
              pageSize: 10,
              total: scheduler.length,
            }}
          />
        </div>
      </div>
      <Modal
        visible={copyVisible}
        title="Copy this Cluster"
        width={300}
        onCancel={() => setCopyVisible(false)}
        footer={[
          <Button
            key="back"
            onClick={() => {
              setCopyVisible(false);
              setJson('');
            }}
          >
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={() => {
              createClusters({
                ...updateInfo,
                name: json,
              });
            }}
          >
            Submit
          </Button>,
        ]}
      >
        name
        <Input
          placeholder="Please enter the name"
          onChange={(e) => {
            setJson(e.target.value);
          }}
          style={{
            marginTop: 8,
          }}
        />
      </Modal>
      <Modal
        visible={visible}
        title={dTitle}
        onCancel={() => setVisible(false)}
        footer={
          dTitle.includes('Update')
            ? [
                <Button
                  key="back"
                  onClick={() => {
                    setVisible(false);
                  }}
                >
                  Cancel
                </Button>,
                <Button
                  key="submit"
                  type="primary"
                  onClick={() => {
                    let res = {};
                    try {
                      res = JSON.parse(updateInfo);
                      updateSchedulerById(res.id, res);
                    } catch (e) {
                      console.log(e);
                    }
                  }}
                >
                  Submit
                </Button>,
              ]
            : null
        }
      >
        <CodeEditor
          value={dTitle.includes('Update') ? updateInfo : json}
          height={200}
          options={{
            readOnly: !dTitle.includes('Update'),
          }}
          onChange={(v: any) => {
            setUpdateInfo(v);
          }}
        />
      </Modal>
      <Modal
        visible={formVisible}
        title={dTitle}
        onCancel={() => {
          setFormVisible(false);
          setFormSchema(info);
          setUpdateVisible(false);
        }}
        footer={[
          <Button
            key="back"
            onClick={() => {
              setFormInfo({});
              setUpdateVisible(false);
              setFormVisible(false);
            }}
          >
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={() => {
              if (formInfo.security_group_id) {
                formInfo.security_group_domain = formInfo.security_group_id;
              }

              const params = {
                ...formInfo,
                scopes: {
                  idc: formInfo?.idc || '',
                  net_topology: formInfo?.net_topology || '',
                  location: formInfo?.location || '',
                },
                config: {
                  filter_parent_limit: formInfo?.filter_parent_limit || 3,
                },
                client_config: {
                  load_limit: formInfo?.load_limit || 50,
                  parallel_count: formInfo?.parallel_count || 4,
                },
              };

              if (dTitle.includes('Add')) {
                createClusters(params);
              } else {
                updateClusterById({
                  id: sClusters[isClick]?.id?.toString(),
                  ...params,
                });
              }
            }}
          >
            Submit
          </Button>,
        ]}
      >
        {updateVisible ? (
          <Form
            labelAlign="left"
            layout="vertical"
            onValuesChange={(cv, v) => {
              setFormInfo((pre: any) => {
                return {
                  ...v,
                  ...pre,
                  ...cv,
                };
              });
            }}
          >
            {formSchema.map((sub: any) => {
              const Content = comsKeys[sub.type || 'input'];
              if (sub.type === 'select') {
                sub.props.options = formOps[sub.key] || [];
              }
              if (sub.title) {
                return <h3>{sub.en_US}</h3>;
              } else if (!sub.hide && sub.tab === '1') {
                return (
                  <Form.Item
                    name={sub.key}
                    key={sub.key}
                    label={sub.en_US}
                    {...(sub.formprops || {})}
                  >
                    <Content {...sub.props} />
                  </Form.Item>
                );
              }
            })}
          </Form>
        ) : null}
      </Modal>
    </div>
  );
}
