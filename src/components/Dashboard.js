import React, { useEffect, useState } from 'react';
import AWS from 'aws-sdk';

const Dashboard = () => {
  const [vpnConnections, setVpnConnections] = useState([]);
  const [vpcs, setVpcs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ec2 = new AWS.EC2();

    // Site-to-Site VPN 정보 로드
    ec2.describeVpnConnections({}, (err, data) => {
      if (err) {
        console.error('VPN 정보를 가져오는 중 오류:', err);
      } else {
        setVpnConnections(data.VpnConnections || []);
      }
    });

    // VPC 정보 로드
    ec2.describeVpcs({}, (err, data) => {
      if (err) {
        console.error('VPC 정보를 가져오는 중 오류:', err);
      } else {
        setVpcs(data.Vpcs || []);
      }
      setLoading(false);
    });
  }, []);

  if (loading) return <p>로딩 중...</p>;

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>

      <div className="data-section">
        <h3>Site-to-Site VPN</h3>
        {vpnConnections.length > 0 ? (
          vpnConnections.map((vpn, index) => (
            <div key={index}>
              <p>VPN ID: {vpn.VpnConnectionId}</p>
              <p>State: {vpn.State}</p>
              <hr />
            </div>
          ))
        ) : (
          <p>Site-to-Site VPN 연결 없음</p>
        )}
      </div>

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
