import React, { useEffect, useState } from 'react';
import AWS from 'aws-sdk';

const Dashboard = () => {
  const [vpnConnections, setVpnConnections] = useState([]);
  const [vpnConfig, setVpnConfig] = useState(null);
  const [customerGateways, setCustomerGateways] = useState([]);
  const [selectedCustomerGatewayId, setSelectedCustomerGatewayId] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchVpnConnections = async () => {
    const ec2 = new AWS.EC2();
    try {
      const vpnData = await ec2.describeVpnConnections({}).promise();
      setVpnConnections(vpnData.VpnConnections || []);
    } catch (err) {
      console.error('VPN 정보를 가져오는 중 오류:', err);
    }
  };

  const fetchVpnConfig = async (vpnId) => {
    const ec2 = new AWS.EC2();
    try {
      const vpnData = await ec2.describeVpnConnections({
        VpnConnectionIds: [vpnId],
      }).promise();

      const vpn = vpnData.VpnConnections[0];
      const customerGatewayData = await ec2.describeCustomerGateways({
        CustomerGatewayIds: [vpn.CustomerGatewayId],
      }).promise();
      const customerGateway = customerGatewayData.CustomerGateways[0];

      const tunnels = vpn.Options.TunnelOptions.map((tunnel) => ({
        State: tunnel.Status?.State || '알 수 없음',
        InsideIP: tunnel.TunnelInsideCidr || '정보 없음',
        OutsideIP: tunnel.TunnelOutsideIpAddress || '정보 없음',
        PreSharedKey: tunnel.PreSharedKey || '정보 없음',
      }));

      const vpnDetails = {
        "CustomerGateway": {
          "ID": vpn.CustomerGatewayId,
          "IP": customerGateway?.IpAddress || '정보 없음',
          "InsideCidrBlock": tunnels[0]?.InsideIP || '정보 없음',
          "AuthenticationMethod": vpn.AuthenticationMethod || 'Pre-Shared Key',
        },
        "VirtualPrivateGateway": {
          "IP": vpn.VpnGatewayIp,
          "InsideCidrBlock": tunnels[0]?.InsideIP || '정보 없음',
        },
        "IKE": {
          "Version": vpn.Options.IKEVersions?.[0] || 'IKEv1',
          "EncryptionAlgorithm": vpn.Options.EncryptionAlgorithms?.[0] || 'AES-128',
          "AuthenticationAlgorithm": vpn.Options.AuthenticationAlgorithms?.[0] || 'SHA1',
          "DiffieHellmanGroup": vpn.Options.PfsGroup || 'Group 2',
          "Lifetime": vpn.Options.LifetimeSeconds || 28800,
        },
        "Tunnel": tunnels,
      };

      setVpnConfig(vpnDetails);
    } catch (err) {
      console.error('VPN 설정 정보를 가져오는 중 오류:', err);
    }
  };

  const fetchCustomerGateways = async () => {
    const ec2 = new AWS.EC2();
    try {
      const data = await ec2.describeCustomerGateways({}).promise();
      setCustomerGateways(data.CustomerGateways || []);
    } catch (err) {
      console.error('고객 게이트웨이 정보를 가져오는 중 오류:', err);
    }
  };

  const handleVpnSelection = (vpnId) => {
    fetchVpnConfig(vpnId);
  };

  const handleCustomerGatewayChange = (event) => {
    setSelectedCustomerGatewayId(event.target.value);
  };

  const updateCustomerGatewayId = async () => {
    const ec2 = new AWS.EC2();
    try {
      const params = {
        VpnConnectionId: vpnConfig.CustomerGateway.ID, // assuming vpnConfig contains VPN ID
        CustomerGatewayId: selectedCustomerGatewayId,
      };
      await ec2.modifyVpnConnection(params).promise();
      alert('고객 게이트웨이 ID가 성공적으로 업데이트되었습니다.');
      fetchVpnConfig(vpnConfig.CustomerGateway.ID);  // Re-fetch to update UI
    } catch (err) {
      console.error('고객 게이트웨이 ID 업데이트 중 오류:', err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchVpnConnections();
      await fetchCustomerGateways();
      setLoading(false);
    };

    loadData();
  }, []);

  if (loading) return <p>로딩 중...</p>;

  return (
    <div className="dashboard">
      <h1>Site-to-Site VPN 대시보드</h1>

      <div className="data-section">
        <h3>VPN 연결 목록</h3>
        {vpnConnections.length > 0 ? (
          <ul>
            {vpnConnections.map((vpn, index) => (
              <li 
                key={index} 
                onClick={() => handleVpnSelection(vpn.VpnConnectionId)} 
                style={{
                  color: vpn.State === 'deleted' ? 'red' : 'inherit',
                  fontWeight: vpn.State === 'deleted' ? 'bold' : 'normal'
                }}
              >
                {vpn.VpnConnectionId} {vpn.State === 'deleted' && <span style={{ color: 'red' }}> (Deleted)</span>}
              </li>
            ))}
          </ul>
        ) : (
          <p>Site-to-Site VPN 연결 없음</p>
        )}
      </div>

      {vpnConfig && (
        <div className="data-section">
          <h3>VPN 설정 정보</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th colSpan="2">VPN 설정</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Customer Gateway ID:</strong></td>
                  <td>
                    <select value={selectedCustomerGatewayId} onChange={handleCustomerGatewayChange}>
                      <option value="">-- 고객 게이트웨이 선택 --</option>
                      {customerGateways.map((cg) => (
                        <option key={cg.CustomerGatewayId} value={cg.CustomerGatewayId}>
                          {cg.CustomerGatewayId} ({cg.IpAddress})
                        </option>
                      ))}
                    </select>
                    <button onClick={updateCustomerGatewayId}>수정</button>
                  </td>
                </tr>
                <tr>
                  <td><strong>Customer Gateway IP:</strong></td>
                  <td>{vpnConfig.CustomerGateway.IP}</td>
                </tr>
                <tr>
                  <td><strong>Customer Gateway Inside IP:</strong></td>
                  <td>{vpnConfig.CustomerGateway.InsideCidrBlock}</td>
                </tr>
                <tr>
                  <td><strong>Virtual Private Gateway IP:</strong></td>
                  <td>{vpnConfig.VirtualPrivateGateway.IP}</td>
                </tr>
                <tr>
                  <td><strong>Virtual Private Gateway Inside IP:</strong></td>
                  <td>{vpnConfig.VirtualPrivateGateway.InsideCidrBlock}</td>
                </tr>
                <tr>
                  <td><strong>IKE Version:</strong></td>
                  <td>{vpnConfig.IKE.Version}</td>
                </tr>
                <tr>
                  <td><strong>Encryption Algorithm:</strong></td>
                  <td>{vpnConfig.IKE.EncryptionAlgorithm}</td>
                </tr>
                <tr>
                  <td><strong>Authentication Algorithm:</strong></td>
                  <td>{vpnConfig.IKE.AuthenticationAlgorithm}</td>
                </tr>
                <tr>
                  <td><strong>Diffie-Hellman Group:</strong></td>
                  <td>{vpnConfig.IKE.DiffieHellmanGroup}</td>
                </tr>
                <tr>
                  <td><strong>Lifetime (IKE):</strong></td>
                  <td>{vpnConfig.IKE.Lifetime}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="data-section">
            <h3>터널 정보</h3>
            {vpnConfig.Tunnel && vpnConfig.Tunnel.length > 0 ? (
              vpnConfig.Tunnel.map((tunnel, index) => (
                <div key={index} className="tunnel-info">
                  <h4>터널 {index + 1}</h4>
                  <table>
                    <tbody>
                      <tr>
                        <td><strong>State:</strong></td>
                        <td>{tunnel.State}</td>
                      </tr>
                      <tr>
                        <td><strong>Inside IP:</strong></td>
                        <td>{tunnel.InsideIP}</td>
                      </tr>
                      <tr>
                        <td><strong>Outside IP:</strong></td>
                        <td>{tunnel.OutsideIP}</td>
                      </tr>
                      <tr>
                        <td><strong>Pre-Shared Key:</strong></td>
                        <td>{tunnel.PreSharedKey}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ))
            ) : (
              <p>터널 정보 없음</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
