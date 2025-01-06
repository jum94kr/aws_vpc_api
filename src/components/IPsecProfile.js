import React from 'react';

const IPsecProfile = ({ ipsecInfo }) => {
  if (!ipsecInfo) return null;

  return (
    <div className="ipsec-profile">
      <h3>IPsec 프로파일 정보</h3>
      <div className="table-container">
        <table>
          <tbody>
            <tr>
              <td><strong>VPN 연결 ID:</strong></td>
              <td>{ipsecInfo.VpnConnectionId}</td>
            </tr>
            <tr>
              <td><strong>Customer Gateway ID:</strong></td>
              <td>{ipsecInfo.CustomerGatewayId}</td>
            </tr>
            <tr>
              <td><strong>Tunnel Inside CIDR:</strong></td>
              <td>{ipsecInfo.IpsecSettings?.TunnelInsideCidr || '정보 없음'}</td>
            </tr>
            <tr>
              <td><strong>Pre-Shared Key:</strong></td>
              <td>{ipsecInfo.IpsecSettings?.PreSharedKey || '정보 없음'}</td>
            </tr>
            <tr>
              <td><strong>Tunnel Outside IP:</strong></td>
              <td>{ipsecInfo.IpsecSettings?.TunnelOutsideIp || '정보 없음'}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default IPsecProfile;
