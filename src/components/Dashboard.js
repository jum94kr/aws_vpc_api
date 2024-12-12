import React, { useEffect, useState } from 'react';
import AWS from 'aws-sdk';

const Dashboard = () => {
  const [vpnConnections, setVpnConnections] = useState([]);
  const [vpcs, setVpcs] = useState([]);
  const [customerGateways, setCustomerGateways] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingVpn, setEditingVpn] = useState(null); // 현재 편집 중인 VPN ID
  const [editedValues, setEditedValues] = useState({}); // 수정된 값 저장

  useEffect(() => {
    const ec2 = new AWS.EC2();

    const fetchResources = async () => {
      setLoading(true);
      try {
        // VPN 정보 로드
        const vpnData = await ec2.describeVpnConnections({}).promise();
        setVpnConnections(vpnData.VpnConnections || []);

        // VPC 정보 로드
        const vpcData = await ec2.describeVpcs({}).promise();
        setVpcs(vpcData.Vpcs || []);

        // Customer Gateway 정보 로드
        const customerGatewayData = await ec2.describeCustomerGateways({}).promise();
        setCustomerGateways(customerGatewayData.CustomerGateways || []);
        console.log(customerGatewayData.CustomerGateways); // Customer Gateway 정보 출력
      } catch (err) {
        console.error('리소스를 가져오는 중 오류:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, []);

  const handleEdit = (vpnId) => {
    setEditingVpn(vpnId);
    const currentVpn = vpnConnections.find((vpn) => vpn.VpnConnectionId === vpnId);
    setEditedValues({
      CustomerGatewayId: currentVpn.CustomerGatewayId,
      TransitGatewayId: currentVpn.TransitGatewayId,
    });
  };

  const handleInputChange = (field, value) => {
    setEditedValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    const ec2 = new AWS.EC2();
    try {
      await ec2.modifyVpnConnection({
        VpnConnectionId: editingVpn,
        CustomerGatewayId: editedValues.CustomerGatewayId,
        TransitGatewayId: editedValues.TransitGatewayId,
      }).promise();
      alert('VPN 설정이 수정되었습니다.');
      setEditingVpn(null);
      // 리소스 다시 로드
      const updatedVpnData = await ec2.describeVpnConnections({}).promise();
      setVpnConnections(updatedVpnData.VpnConnections || []);
    } catch (err) {
      console.error('VPN 설정 수정 중 오류:', err);
      alert('VPN 설정 수정 중 오류가 발생했습니다.');
    }
  };

  const handleCancel = () => {
    setEditingVpn(null);
    setEditedValues({});
  };

  if (loading) return <p>로딩 중...</p>;

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>

      {/* Site-to-Site VPN 섹션 */}
      <div className="data-section">
        <h3>Site-to-Site VPN</h3>
        {vpnConnections.length > 0 ? (
          vpnConnections.map((vpn) => {
            // Customer Gateway Address 찾기
            const customerGateway = customerGateways.find(cg => cg.CustomerGatewayId === vpn.CustomerGatewayId);
            console.log(customerGateway); // Customer Gateway 정보 출력
            const customerGatewayAddress = customerGateway ? customerGateway.IPAddress : 'N/A';

            return (
              <div key={vpn.VpnConnectionId}>
                {editingVpn === vpn.VpnConnectionId ? (
                  <div>
                    <p>
                      VPN ID: <strong>{vpn.VpnConnectionId}</strong>
                    </p>
                    <label>
                      Customer Gateway ID:
                      <select
                        value={editedValues.CustomerGatewayId || ''}
                        onChange={(e) => handleInputChange('CustomerGatewayId', e.target.value)}
                      >
                        <option value="">선택하세요</option>
                        {customerGateways.map((cg) => (
                          <option key={cg.CustomerGatewayId} value={cg.CustomerGatewayId}>
                            {cg.CustomerGatewayId} - {cg.IPAddress}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Transit Gateway ID:
                      <input
                        type="text"
                        value={editedValues.TransitGatewayId || ''}
                        onChange={(e) => handleInputChange('TransitGatewayId', e.target.value)}
                      />
                    </label>
                    <button onClick={handleSave}>저장</button>
                    <button onClick={handleCancel}>취소</button>
                  </div>
                ) : (
                  <div>
                    <p>VPN ID: {vpn.VpnConnectionId}</p>
                    <p>Customer Gateway ID: {vpn.CustomerGatewayId}</p>
                    <p>Customer Gateway Address: {customerGatewayAddress}</p>
                    <p>Transit Gateway ID: {vpn.TransitGatewayId}</p>
                    <button onClick={() => handleEdit(vpn.VpnConnectionId)}>수정</button>
                  </div>
                )}
                <hr />
              </div>
            );
          })
        ) : (
          <p>Site-to-Site VPN 연결 없음</p>
        )}
      </div>

      {/* VPC 섹션 */}
      <div className="data-section">
        <h3>VPC 정보</h3>
        {vpcs.length > 0 ? (
          vpcs.map((vpc, index) => (
            <div key={index}>
              <p>VPC ID: {vpc.VpcId}</p>
              <p>상태: {vpc.State}</p>
              <hr />
            </div>
          ))
        ) : (
          <p>VPC 없음</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
