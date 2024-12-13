import React, { useEffect, useState } from 'react';
import AWS from 'aws-sdk';

const Dashboard = () => {
  const [vpnConnections, setVpnConnections] = useState([]);
  const [vpnConfig, setVpnConfig] = useState(null);
  const [detailedConfig, setDetailedConfig] = useState(null);
  const [expandedConfig, setExpandedConfig] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedVpn, setSelectedVpn] = useState(null);
  const [customerGatewayIp, setCustomerGatewayIp] = useState('');
  const [customerGateways, setCustomerGateways] = useState([]); // Customer Gateway 목록 상태 추가
  const [selectedCustomerGateway, setSelectedCustomerGateway] = useState(null); // 선택된 Customer Gateway 상태
  const [notification, setNotification] = useState(''); // 알림 상태 추가

  // 모든 VPN 연결 정보 가져오기
  const fetchVpnConnections = async () => {
    const ec2 = new AWS.EC2();
    try {
      const vpnData = await ec2.describeVpnConnections({}).promise();
      console.log("VPN Connections Data:", vpnData);
      setVpnConnections(vpnData.VpnConnections || []);
    } catch (err) {
      console.error('VPN 정보를 가져오는 중 오류:', err);
    }
  };

  // 모든 Customer Gateway 정보 가져오기
  const fetchCustomerGateways = async () => {
    const ec2 = new AWS.EC2();
    try {
      const customerData = await ec2.describeCustomerGateways({}).promise();
      console.log("Customer Gateways Data:", customerData);
      setCustomerGateways(customerData.CustomerGateways || []);
    } catch (err) {
      console.error('Customer Gateway 정보를 가져오는 중 오류:', err);
    }
  };

  // 특정 VPN 연결의 주요 설정 정보 가져오기
  const fetchVpnConfig = async (vpnId) => {
    const ec2 = new AWS.EC2();
    try {
      const vpnData = await ec2.describeVpnConnections({
        VpnConnectionIds: [vpnId],
      }).promise();

      console.log("Fetched VPN Data:", vpnData);
      setVpnConfig(vpnData.VpnConnections[0]);
      setSelectedVpn(vpnId);

      // Customer Gateway ID와 관련된 정보를 가져옴
      const customerGatewayId = vpnData.VpnConnections[0].CustomerGatewayId;
      setSelectedCustomerGateway(customerGatewayId); // 선택된 Customer Gateway 상태 업데이트
      fetchCustomerGatewayIp(customerGatewayId);
    } catch (err) {
      console.error('VPN 설정 정보를 가져오는 중 오류:', err);
    }
  };

  // Customer Gateway IP 정보 가져오기
  const fetchCustomerGatewayIp = async (customerGatewayId) => {
    const ec2 = new AWS.EC2();
    try {
      const customerData = await ec2.describeCustomerGateways({
        CustomerGatewayIds: [customerGatewayId],
      }).promise();
      console.log("Customer Gateway Data:", customerData);
      setCustomerGatewayIp(customerData.CustomerGateways[0]?.IpAddress || '정보 없음');
    } catch (err) {
      console.error('Customer Gateway IP 정보를 가져오는 중 오류:', err);
    }
  };

  // 선택된 Customer Gateway로 VPN 설정 업데이트
  const updateVpnConfig = async (newCustomerGatewayId) => {
    const ec2 = new AWS.EC2();
    try {
      const params = {
        VpnConnectionId: vpnConfig?.VpnConnectionId, // null 체크 추가
        CustomerGatewayId: newCustomerGatewayId,
      };
      await ec2.modifyVpnConnection(params).promise();
      console.log('VPN 설정이 업데이트되었습니다.');

      // VPN 설정 업데이트 후, 새로운 Customer Gateway 정보로 업데이트
      setSelectedCustomerGateway(newCustomerGatewayId);
      fetchVpnConfig(vpnConfig?.VpnConnectionId); // 다시 VPN 정보를 새로 불러옴

      // 알림 표시
      setNotification('Customer Gateway가 성공적으로 변경되었습니다!');
    } catch (err) {
      console.error('VPN 설정을 업데이트하는 중 오류:', err);
      setNotification('VPN 설정을 변경하는 중 오류가 발생했습니다.');
    }
  };

  // 상세한 VPN 설정을 가져오는 함수 (fetchDetailedConfig 정의 추가)
  const fetchDetailedConfig = async (vpnId) => {
    const ec2 = new AWS.EC2();
    try {
      const vpnData = await ec2.describeVpnConnections({
        VpnConnectionIds: [vpnId],
      }).promise();

      console.log("Fetched Detailed VPN Data:", vpnData);
      setDetailedConfig(vpnData.VpnConnections[0]);
    } catch (err) {
      console.error('VPN 세부 정보를 가져오는 중 오류:', err);
    }
  };

  const handleVpnSelection = (vpnId) => {
    fetchVpnConfig(vpnId);
  };

  const toggleExpandedConfig = (vpnId) => {
    if (expandedConfig && detailedConfig?.VpnConnectionId === vpnId) {
      setExpandedConfig(false);
      setDetailedConfig(null);
    } else {
      fetchDetailedConfig(vpnId);
      setExpandedConfig(true);
    }
  };

  // VPN 연결 목록 가져오기
  useEffect(() => {
    const loadData = async () => {
      await fetchVpnConnections();
      await fetchCustomerGateways(); // Customer Gateway 목록도 가져오기
      setLoading(false);
    };

    loadData();
  }, []);

  // VPN 이름 가져오기 (Tags에서 Name 값 찾기)
  const getVpnName = (vpn) => {
    const nameTag = vpn.Tags?.find(tag => tag.Key === "Name");
    return nameTag ? nameTag.Value : '이름 없음';
  };

  if (loading) return <p>로딩 중...</p>;

  return (
    <div className="dashboard">
      <h1>Site-to-Site VPN 대시보드</h1>

      <div className="data-section">
        <h3>VPN 연결 목록</h3>
        {vpnConnections.length > 0 ? (
          <div className="vpn-button-group">
            {vpnConnections.map((vpn, index) => (
              <div key={index} className="vpn-item">
                <button
                  onClick={() => handleVpnSelection(vpn.VpnConnectionId)}
                  className={`vpn-button ${vpn.State === 'deleted' ? 'deleted' : ''}`}
                >
                  {getVpnName(vpn)} ({vpn.VpnConnectionId})
                  {vpn.State === 'deleted' && (
                    <span className="deleted-tag"> (Deleted)</span>
                  )}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p>Site-to-Site VPN 연결 없음</p>
        )}
      </div>

      {vpnConfig && (
        <div className="data-section">
          <h3>VPN 연결 설정 정보</h3>
          <div className="table-container">
            <table>
              <tbody>
                <tr>
                  <td><strong>VPN 이름:</strong></td>
                  <td>{getVpnName(vpnConfig)}</td>
                </tr>
                <tr>
                  <td><strong>Customer Gateway ID:</strong></td>
                  <td>
                    {/* Customer Gateway 선택 드롭다운 추가 */}
                    <select
                      value={selectedCustomerGateway}
                      onChange={(e) => setSelectedCustomerGateway(e.target.value)}
                    >
                      {customerGateways.map((gateway) => (
                        <option key={gateway.CustomerGatewayId} value={gateway.CustomerGatewayId}>
                          {gateway.CustomerGatewayId} - {gateway.IPAddress}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => updateVpnConfig(selectedCustomerGateway)}
                      className="update-button"
                    >
                      수정
                    </button>
                  </td>
                </tr>
                <tr>
                  <td><strong>Customer Gateway IP:</strong></td>
                  <td>{customerGatewayIp || '정보 없음'}</td>
                </tr>
                <tr>
                  <td><strong>VPN Gateway ID:</strong></td>
                  <td>{vpnConfig.VpnGatewayId || '정보 없음'}</td>
                </tr>
                <tr>
                  <td><strong>State:</strong></td>
                  <td>{vpnConfig.State || '정보 없음'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {vpnConfig && vpnConfig.Options?.TunnelOptions?.length > 0 && (
        <div className="data-section">
          <h3>Tunnel 설정 정보</h3>
          <div className="table-container">
            <table>
              <tbody>
                {vpnConfig.Options.TunnelOptions.map((tunnel, index) => (
                  <React.Fragment key={index}>
                    <tr>
                      <td><strong>Tunnel {index + 1} Outside IP:</strong></td>
                      <td>{tunnel.OutsideIpAddress || '정보 없음'}</td>
                    </tr>
                    <tr>
                      <td><strong>Tunnel {index + 1} Inside IP:</strong></td>
                      <td>{tunnel.TunnelInsideCidr || '정보 없음'}</td>
                    </tr>
                    <tr>
                      <td><strong>Tunnel {index + 1} Pre-Shared Key:</strong></td>
                      <td>{tunnel.PreSharedKey || '정보 없음'}</td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="data-section">
        {selectedVpn === vpnConfig?.VpnConnectionId && ( // null 체크 추가
          <div style={{ marginTop: '20px' }}>
            <button
              onClick={() => toggleExpandedConfig(vpnConfig?.VpnConnectionId)} // null 체크 추가
              className="details-button"
            >
              {expandedConfig && detailedConfig?.VpnConnectionId === vpnConfig?.VpnConnectionId
                ? '세부 정보 닫기'
                : '세부 정보 보기'}
            </button>
          </div>
        )}
      </div>

      {expandedConfig && detailedConfig && (
        <div className="data-section">
          <h3>VPN 연결 세부 정보</h3>
          <pre>{JSON.stringify(detailedConfig, null, 2)}</pre>
        </div>
      )}

      {/* 알림 표시 */}
      {notification && (
        <div className="notification-popup">
          <p>{notification}</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
