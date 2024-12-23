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
  const [customerGateways, setCustomerGateways] = useState([]);
  const [selectedCustomerGateway, setSelectedCustomerGateway] = useState(null);

  // Customer Gateway 추가 상태
  const [newCustomerGatewayIp, setNewCustomerGatewayIp] = useState('');
  const [newCustomerGatewayBgpAsn, setNewCustomerGatewayBgpAsn] = useState('');
  const [newCustomerGatewayName, setNewCustomerGatewayName] = useState('');

  // 모든 VPN 연결 정보 가져오기
  const fetchVpnConnections = async () => {
    const ec2 = new AWS.EC2();
    try {
      const vpnData = await ec2.describeVpnConnections({}).promise();
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
      setCustomerGateways(customerData.CustomerGateways || []);
    } catch (err) {
      console.error('Customer Gateway 정보를 가져오는 중 오류:', err);
    }
  };

  // 새로운 Customer Gateway 추가
  const addCustomerGateway = async () => {
    setLoading(true); // 로딩 시작

    // 입력값 검증
    if (!newCustomerGatewayIp || !newCustomerGatewayBgpAsn || !newCustomerGatewayName) {
      alert('IP 주소, BGP ASN, 그리고 Name을 모두 입력해주세요.');
      setLoading(false);
      return;
    }

    // IP 주소 형식 검증
    const ipRegex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipRegex.test(newCustomerGatewayIp)) {
      alert('올바른 IP 주소 형식을 입력해주세요.');
      setLoading(false);
      return;
    }

    // BGP ASN 형식 검증
    if (isNaN(newCustomerGatewayBgpAsn) || newCustomerGatewayBgpAsn <= 0) {
      alert('올바른 BGP ASN을 입력해주세요.');
      setLoading(false);
      return;
    }

    const ec2 = new AWS.EC2();
    try {
      const params = {
        IpAddress: newCustomerGatewayIp,
        BgpAsn: newCustomerGatewayBgpAsn,
        Type: 'ipsec.1',  // Type 파라미터 추가
      };
      const result = await ec2.createCustomerGateway(params).promise();
      console.log('새로운 Customer Gateway 생성:', result);

      // 생성된 Customer Gateway에 Name 태그 추가
      const createTagsParams = {
        Resources: [result.CustomerGateway.CustomerGatewayId],
        Tags: [
          {
            Key: 'Name',
            Value: newCustomerGatewayName,  // Name 태그 추가
          },
        ],
      };

      // Tag 추가 API 호출
      await ec2.createTags(createTagsParams).promise();
      console.log('Customer Gateway에 Name 태그 추가 완료');

      // 성공적으로 추가된 후, Customer Gateway 목록을 새로 고침
      fetchCustomerGateways();
      setNewCustomerGatewayIp(''); // 입력값 초기화
      setNewCustomerGatewayBgpAsn(''); // 입력값 초기화
      setNewCustomerGatewayName(''); // 입력값 초기화

      alert('Customer Gateway가 성공적으로 추가되었습니다!');
    } catch (err) {
      console.error('새로운 Customer Gateway를 생성하는 중 오류:', err);
      alert('Customer Gateway 추가에 실패했습니다. 오류: ' + err.message);
    } finally {
      setLoading(false); // 로딩 종료
    }
  };

  // VPN 설정 정보 가져오기
  const fetchVpnConfig = async (vpnId) => {
    const ec2 = new AWS.EC2();
    try {
      const vpnData = await ec2.describeVpnConnections({
        VpnConnectionIds: [vpnId],
      }).promise();
      setVpnConfig(vpnData.VpnConnections[0]);
      setSelectedVpn(vpnId);

      const customerGatewayId = vpnData.VpnConnections[0].CustomerGatewayId;
      setSelectedCustomerGateway(customerGatewayId);
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
      setCustomerGatewayIp(customerData.CustomerGateways[0]?.IpAddress || '정보 없음');
    } catch (err) {
      console.error('Customer Gateway IP 정보를 가져오는 중 오류:', err);
    }
  };

  // VPN 설정 업데이트 함수
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
    } catch (err) {
      console.error('VPN 설정을 업데이트하는 중 오류:', err);
    }
  };

  // 상세한 VPN 설정을 가져오는 함수
  const fetchDetailedConfig = async (vpnId) => {
    const ec2 = new AWS.EC2();
    try {
      const vpnData = await ec2.describeVpnConnections({
        VpnConnectionIds: [vpnId],
      }).promise();
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

      {/* Customer Gateway 생성 섹션 */}
      <div className="data-section">
        <h3>새로운 Customer Gateway 생성</h3>
        <div>
          <label>
            IP 주소:
            <input
              type="text"
              value={newCustomerGatewayIp}
              onChange={(e) => setNewCustomerGatewayIp(e.target.value)}
              placeholder="Customer Gateway IP 주소 입력"
            />
          </label>
        </div>
        <div>
          <label>
            BGP ASN:
            <input
              type="text"
              value={newCustomerGatewayBgpAsn}
              onChange={(e) => setNewCustomerGatewayBgpAsn(e.target.value)}
              placeholder="BGP ASN 입력"
            />
          </label>
        </div>
        <div>
          <label>
            Name:
            <input
              type="text"
              value={newCustomerGatewayName}
              onChange={(e) => setNewCustomerGatewayName(e.target.value)}
              placeholder="Customer Gateway Name"
            />
          </label>
        </div>
        <button onClick={addCustomerGateway} disabled={loading}>Customer Gateway 생성</button>
      </div>

      {/* VPN 연결 목록 */}
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

      {/* VPN 연결 설정 정보 */}
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
                    <select
                      value={selectedCustomerGateway}
                      onChange={(e) => updateVpnConfig(e.target.value)}
                    >
                      {customerGateways.map((gateway) => (
                        <option key={gateway.CustomerGatewayId} value={gateway.CustomerGatewayId}>
                          {gateway.CustomerGatewayId} - {gateway.IPAddress}
                        </option>
                      ))}
                    </select>
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

      {/* Tunnel 설정 정보 */}
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

      {/* 상세 정보 보기 버튼 */}
      <div className="data-section">
        {selectedVpn === vpnConfig?.VpnConnectionId && (
          <div style={{ marginTop: '20px' }}>
            <button
              onClick={() => toggleExpandedConfig(vpnConfig?.VpnConnectionId)}
              className="details-button"
            >
              {expandedConfig && detailedConfig?.VpnConnectionId === vpnConfig?.VpnConnectionId
                ? '세부 정보 닫기'
                : '세부 정보 보기'}
            </button>
          </div>
        )}
      </div>

      {/* 세부 정보 */}
      {expandedConfig && detailedConfig && (
        <div className="data-section">
          <h3>VPN 연결 세부 정보</h3>
          <pre>{JSON.stringify(detailedConfig, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
