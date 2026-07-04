import * as THREE from 'three';
import { useMemo, useRef, useState, useEffect } from 'react';
import { CARD_WIDTH, CARD_HEIGHT, GLOBE_RADIUS, LOCATIONS } from '../data';

// Helper function to composite the VIP user's portrait or gold stamp onto a beautiful Vingroup investment photo
function compositePortfolioCard(
  travelImageUrl: string,
  userPhotoBase64: string | null,
  locationName: string,
  callback: (compositedUrl: string) => void
) {
  const travelImg = new Image();
  travelImg.crossOrigin = 'anonymous';
  travelImg.src = travelImageUrl;

  travelImg.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 533; // 3:4 ratio

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      callback(travelImageUrl);
      return;
    }

    // 1. Draw project background photo
    ctx.drawImage(travelImg, 0, 0, 400, 533);

    // 2. Draw gold metallic borders (Urban Sovereign style)
    ctx.strokeStyle = '#d4af37'; // Luxury Gold
    ctx.lineWidth = 12;
    ctx.strokeRect(6, 6, 388, 521);

    // Draw inner thin gold accent border
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(18, 18, 364, 497);

    // 3. Draw premium glassmorphic bottom bar
    ctx.fillStyle = 'rgba(10, 10, 10, 0.85)';
    ctx.fillRect(12, 430, 376, 91);

    // Glass reflection highlight line
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(12, 430, 376, 3);

    // 4. Draw luxury text for the Portfolio/Company
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    
    let name = locationName || "DỰ ÁN ĐẦU TƯ";
    if (name.length > 28) {
      name = name.slice(0, 26) + "...";
    }
    ctx.fillText(name.toUpperCase(), 24, 460);

    ctx.fillStyle = '#d4af37';
    ctx.font = '9px monospace';
    ctx.fillText("HỆ SINH THÁI VINCLUB VIP", 24, 485);

    // 5. Draw the user's "VIP CO-OWNER" badge if they uploaded a photo
    if (userPhotoBase64) {
      const userImg = new Image();
      userImg.src = userPhotoBase64;
      userImg.onload = () => {
        ctx.save();
        
        const pW = 85;
        const pH = 100;
        const pX = 295;
        const pY = 415;

        // Draw small VIP portrait container
        ctx.fillStyle = '#000000';
        ctx.fillRect(pX, pY, pW, pH);
        ctx.drawImage(userImg, pX + 4, pY + 4, pW - 8, pH - 24);
        
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 2;
        ctx.strokeRect(pX, pY, pW, pH);

        // Subtitle inside VIP portrait container
        ctx.fillStyle = '#d4af37';
        ctx.font = 'bold 7px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText("CỔ ĐÔNG VIP", pX + pW / 2, pY + pH - 10);

        ctx.restore();
        try {
          callback(canvas.toDataURL('image/jpeg', 0.9));
        } catch (e) {
          console.warn("toDataURL failed in userPhoto block, falling back to raw travelImageUrl", e);
          callback(travelImageUrl);
        }
      };
      userImg.onerror = () => {
        try {
          callback(canvas.toDataURL('image/jpeg', 0.9));
        } catch (e) {
          console.warn("toDataURL failed in userPhoto error handler, falling back to raw travelImageUrl", e);
          callback(travelImageUrl);
        }
      };
    } else {
      // Sleek VIP gold medal stamp seal at the bottom right
      ctx.save();
      ctx.beginPath();
      ctx.arc(335, 475, 24, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(212, 175, 55, 0.2)';
      ctx.fill();
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#d4af37';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText("VINCLUB", 335, 470);
      ctx.font = 'bold 7px sans-serif';
      ctx.fillText("INVEST", 335, 480);
      ctx.restore();

      try {
        callback(canvas.toDataURL('image/jpeg', 0.9));
      } catch (e) {
        console.warn("toDataURL failed in base block, falling back to raw travelImageUrl", e);
        callback(travelImageUrl);
      }
    }
  };

  travelImg.onerror = () => {
    callback(travelImageUrl);
  };
}

const FALLBACK_UNSPLASH_IDS: Record<string, string> = {
  "Vinhomes Riverside, Hà Nội": "photo-1600585154340-be6161a56a0c",
  "Vinhomes Grand Park, TP.HCM": "photo-1545324418-cc1a3fa10c00",
  "Vinhomes Ocean Park, Gia Lâm": "photo-1512917774080-9991f1c4c750",
  "Vinhomes Golden River, Ba Son": "photo-1486406146926-c627a92ad1ab",
  "Vincom Center Đồng Khởi": "photo-1568254183919-78a4f43a2877",
  "Vincom Mega Mall Royal City": "photo-1519501025264-65ba15a82390",
  "Vincom Plaza Đà Nẵng": "photo-1555529669-e69e7aa0ba9a",
  "VinOffice Tower Hà Nội": "photo-1497366216548-37526070297c",
  "Biệt thự Vinhomes Central Park": "photo-1600596542815-ffad4c1539a9",
  "Nhà ở xã hội Happy Town": "photo-1582407947304-fd86f028f716",
  "Vinpearl Resort Nha Trang": "photo-1571896349842-33c89424de2d",
  "Vinpearl Luxury Đà Nẵng": "photo-1540541338287-41700207dee6",
  "Vinpearl Golf Nam Hội An": "photo-1587174486073-ae5e5cff23aa",
  "VinOasis Phú Quốc": "photo-1542314831-068cd1dbfeeb",
  "Vinpearl Safari Phú Quốc": "photo-1534447677768-be436bb09401",
  "VinWonders Nha Trang": "photo-1505995433366-e12047f3f144",
  "Vinpearl Golf Hải Phòng": "photo-1535131749006-b7f58c99034b",
  "Hệ thống Vinschool Times City": "photo-1577896851231-70ef18881754",
  "Đại học Tinh hoa VinUni": "photo-1562774053-701939374585",
  "Bệnh viện Vinmec Times City": "photo-1584515979956-d9f6e5d09982",
  "Bệnh viện Vinmec Central Park": "photo-1519494026892-80bbd2d6fd0d",
  "Chuỗi bán lẻ dược phẩm VinFA": "photo-1586015555751-63bb77f4322a",
  "Tập đoàn xe điện toàn cầu VinFast": "photo-1617788138017-80ad40651399",
  "Nhà máy Ô tô VinFast Hải Phòng": "photo-1581091226825-a6a2a5aee158",
  "Xe buýt điện thông minh VinBus": "photo-1570125909232-eb263c188f7e",
  "Điện thoại thông minh Vsmart": "photo-1511707171634-5f897ff02aa9",
  "Siêu thị WinMart Times City": "photo-1542838132-92c53300491e",
  "Cửa hàng WinMart+": "photo-1604719312566-8912e9227c6a",
  "Thương mại điện tử Adayroi": "photo-1460925895917-afdab827c52f",
  "Chuỗi điện máy VinPro": "photo-1518770660439-4636190af475",
  "Bán lẻ thời trang VinDS": "photo-1483985988355-763728e1935b",
  "Hệ thống Viễn Thông A": "photo-1511707171634-5f897ff02aa9",
  "Viện Trí tuệ Nhân tạo VinAI": "photo-1526374965328-7f61d4dc18c5",
  "Nghiên cứu dữ liệu lớn VinBigData": "photo-1507146426996-ef05306b995a",
  "Hệ thống an ninh mạng VinCSS": "photo-1563986768609-322da13575f3",
  "Phát triển phần mềm HMS": "photo-1555066931-4365d14bab8c",
  "Nghiên cứu nguyên vật liệu VinTech": "photo-1532187643603-ba119ca4109e",
  "Dịch vụ công nghệ VinConnect": "photo-1515378791036-0648a3ef77b2",
  "Số hóa doanh nghiệp VinDiGix": "photo-1451187580459-43490279c0fa",
  "Hãng hàng không Vinpearl Air": "photo-1436491865332-7a61a109cc05",
  "Trường đào tạo phi công VinAviation": "photo-1517976487492-5750f3195933",
  "Xưởng phim hoạt hình VinTaTa": "photo-1534447677768-be436bb09401",
  "Hỗ trợ khởi nghiệp VinVentures": "photo-1559136555-9303baea8ebd",
  "Chăm sóc sức khỏe VinCharm": "photo-1519699047748-de8e457a634e",
  "Bán lẻ ngành trẻ em VinKC": "photo-1513159446162-54eb8bdaa79b",
  "Đại lý công nghệ One Mount Group": "photo-1552664730-d307ca884978",
  "Cổng thanh toán & Ví VinID": "photo-1559526324-4b87b5e36e44",
  "Quỹ Vì Tương Lai Xanh": "photo-1542601906990-b4d3fb778b09"
};

const FALLBACK_DESCRIPTIONS: Record<string, string> = {
  "Vinhomes Riverside, Hà Nội": "Khu đô thị sinh thái đẳng cấp bậc nhất Thủ đô mang phong cách lãng mạn Venice. Quy tụ cộng đồng cư dân tinh hoa với hàng trăm biệt thự vườn sang trọng, bao quanh bởi hệ thống kênh đào trong lành dài 18.6km và thảm xanh rộng lớn, biểu tượng của sự phồn vinh và cuộc sống thượng lưu chuẩn mực.",
  "Vinhomes Grand Park, TP.HCM": "Đại đô thị thông minh chuẩn mực quốc tế tọa lạc tại trung tâm phía Đông Sài Gòn. Tích hợp công viên 36ha quy mô hàng đầu Đông Nam Á, hệ thống vận hành thông minh và cộng đồng cư dân đa quốc gia năng động, mang lại tiềm năng gia tăng giá trị đầu tư vượt trội.",
  "Vinhomes Ocean Park, Gia Lâm": "Thành phố Biển hồ - kỳ quan đô thị có một không hai tại phía Đông Hà Nội. Sở hữu bộ đôi biển hồ nước mặn 6.1ha và hồ Ngọc Trai cát trắng 24.5ha, kiến tạo trải nghiệm sống nghỉ dưỡng giữa lòng phố thị sầm uất cho cư dân toàn cầu.",
  "Vinhomes Golden River, Ba Son": "Dự án căn hộ và biệt thự siêu cao cấp sở hữu vị thế độc tôn bên bờ sông Sài Gòn ngay trung tâm Quận 1. Được kiến tạo trên mảnh đất Ba Son lịch sử, dự án mang thiết kế kính chạm sàn Low-E hiện đại và nội thất xa hoa từ các thương hiệu hàng đầu thế giới.",
  "Vincom Center Đồng Khởi": "Tòa tháp biểu tượng trung tâm tài chính và thương mại Sài Gòn, điểm đến mua sắm và giải trí thời thượng của tầng lớp tinh hoa, với thiết kế xanh tiết kiệm năng lượng đạt chuẩn quốc tế.",
  "Vincom Mega Mall Royal City": "Quần thể trung tâm thương mại ngầm lớn nhất Đông Nam Á, mang phong cách kiến trúc hoàng gia châu Âu tinh tế. Điểm nhấn là khu vui chơi giải trí khép kín, rạp chiếu phim hiện đại và hàng trăm gian hàng ẩm thực quốc tế đỉnh cao.",
  "Vincom Plaza Đà Nẵng": "Điểm hẹn mua sắm, ẩm thực và trải nghiệm giải trí đẳng cấp bên bờ sông Hàn thơ mộng, đóng vai trò là động lực kinh tế thương mại quan trọng của thành phố đáng sống nhất Việt Nam.",
  "VinOffice Tower Hà Nội": "Chuỗi tháp văn phòng hạng A cao cấp sở hữu chứng chỉ xanh quốc tế. Không gian làm việc thông minh tích hợp công nghệ quản lý hiện đại mang lại hiệu quả tối đa cho các tập đoàn đa quốc gia và tổ chức tài chính hàng đầu."
};

interface CardProps {
  index: number;
  position: THREE.Vector3;
  scale?: number;
  userPhoto: string;
  project?: any;
  onSelect: (image: string, location: string, info: string, project?: any) => void;
  onHover?: (info: string) => void;
  onHoverOut?: () => void;
}

export default function Card({ index, position, scale = 1, userPhoto, project, onSelect, onHover, onHoverOut }: CardProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [cardInfo, setCardInfo] = useState<{ base64: string; location: string, info: string } | null>(null);
  
  // Create a default gray material
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    let active = true;

    // Load dark carbon-fiber textured canvas as initial texture
    const darkCanvas = document.createElement('canvas');
    darkCanvas.width = 400;
    darkCanvas.height = 500;
    const gCtx = darkCanvas.getContext('2d');
    if (gCtx) {
      gCtx.fillStyle = '#1c1917';
      gCtx.fillRect(0, 0, 400, 500);
      // Gold placeholder line
      gCtx.strokeStyle = '#d4af37';
      gCtx.lineWidth = 4;
      gCtx.strokeRect(10, 10, 380, 480);
    }
    const initialTex = new THREE.CanvasTexture(darkCanvas);
    initialTex.minFilter = THREE.LinearMipmapLinearFilter;
    initialTex.generateMipmaps = true;
    setTexture(initialTex);

    if (project) {
      const location = project.name;
      const imageUrl = project.imageUrl || "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=400&h=533&q=80";
      const info = `# ${project.name}\n\nLãi suất: ${project.interestRate || '1.10 %'}\nThời hạn: ${project.duration || '7200 phút'}\nTối thiểu: ${project.minInvestment || '5.000.000 VNĐ'}\nQuy mô: ${project.scale || '500.000.000 VNĐ'}`;

      const loadAndSetTexture = (imgSrc: string) => {
        const loader = new THREE.TextureLoader();
        loader.setCrossOrigin('anonymous');
        loader.load(imgSrc, (loadedTex) => {
          loadedTex.minFilter = THREE.LinearMipmapLinearFilter;
          loadedTex.generateMipmaps = true;
          if (active) {
            setTexture(loadedTex);
            setCardInfo({ base64: imgSrc, location, info });
          }
        });
      };

      compositePortfolioCard(imageUrl, userPhoto || null, location, (compositedUrl) => {
        if (active) {
          loadAndSetTexture(compositedUrl);
        }
      });

      return () => {
        active = false;
      };
    }
    
    // Start fetching as soon as possible, but stagger significantly to avoid NGINX 429 Too Many Requests
    const delay = index * 300;

    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/generate-location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ index })
        });
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        
        if (data && data.success && data.base64 && active) {
          const loadAndSetTexture = (imgSrc: string) => {
            const loader = new THREE.TextureLoader();
            loader.setCrossOrigin('anonymous');
            loader.load(
              imgSrc,
              (loadedTex) => {
                loadedTex.minFilter = THREE.LinearMipmapLinearFilter;
                loadedTex.generateMipmaps = true;
                if (active) {
                  setTexture(loadedTex);
                  setCardInfo({ base64: imgSrc, location: data.location, info: data.info });
                }
              },
              undefined,
              (err) => {
                console.warn("Failed to load fetched image texture, falling back to local canvas render", err);
                triggerLocalCanvasFallback();
              }
            );
          };

          compositePortfolioCard(data.base64, userPhoto || null, data.location, (compositedUrl) => {
            if (active) {
              loadAndSetTexture(compositedUrl);
            }
          });
        } else {
          throw new Error("Invalid or unsuccessful response format from API");
        }
      } catch (e) {
        console.warn("Failed to generate/composite for index, triggering offline fallback:", index, e);
        triggerLocalCanvasFallback();
      }

      function triggerLocalCanvasFallback() {
        if (!active) return;
        const location = LOCATIONS[index % LOCATIONS.length];
        const unsplashId = FALLBACK_UNSPLASH_IDS[location] || "photo-1507525428034-b723cf961d3e";
        const imageUrl = `https://images.unsplash.com/${unsplashId}?auto=format&fit=crop&w=400&h=533&q=80`;
        const rawInfo = FALLBACK_DESCRIPTIONS[location] || `Dự án đầu tư sinh thái hàng đầu thuộc hệ thống Vingroup tại ${location}. Cơ hội hợp tác phát triển bền vững cùng VinClub VIP với dòng tiền ổn định và lợi nhuận hấp dẫn lâu dài.`;
        const info = `# ${location}\n\n${rawInfo}`;

        const loadAndSetTextureFallback = (imgSrc: string) => {
          const loader = new THREE.TextureLoader();
          loader.setCrossOrigin('anonymous');
          loader.load(
            imgSrc, 
            (loadedTex) => {
              loadedTex.minFilter = THREE.LinearMipmapLinearFilter;
              loadedTex.generateMipmaps = true;
              if (active) {
                setTexture(loadedTex);
                setCardInfo({ base64: imgSrc, location, info });
              }
            },
            undefined,
            (err) => {
              console.error("Failed to load texture fallback", err);
              // Set a colored canvas fallback texture if image itself fails to load (e.g. offline/blocked)
              if (active) {
                const canvas = document.createElement('canvas');
                canvas.width = 400;
                canvas.height = 533;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  ctx.fillStyle = '#0f2b5c';
                  ctx.fillRect(0, 0, 400, 533);
                  ctx.strokeStyle = '#d4af37';
                  ctx.lineWidth = 12;
                  ctx.strokeRect(6, 6, 388, 521);
                  ctx.fillStyle = '#ffffff';
                  ctx.font = 'bold 16px sans-serif';
                  ctx.textAlign = 'center';
                  ctx.fillText(location.slice(0, 20) + (location.length > 20 ? "..." : ""), 200, 260);
                }
                const fallbackTex = new THREE.CanvasTexture(canvas);
                setTexture(fallbackTex);
                setCardInfo({ base64: canvas.toDataURL(), location, info });
              }
            }
          );
        };

        compositePortfolioCard(imageUrl, userPhoto || null, location, (compositedUrl) => {
          if (active) {
            loadAndSetTextureFallback(compositedUrl);
          }
        });
      }
    }, delay);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [index, userPhoto, project?.id, project?.name, project?.imageUrl, project?.interestRate, project?.duration, project?.minInvestment, project?.scale, project?.status]);

  useEffect(() => {
    if (hovered && cardInfo && onHover) {
      onHover(cardInfo.info);
    }
  }, [cardInfo, hovered, onHover]);

  const rotationQuaternion = useMemo(() => {
    const dummy = new THREE.Object3D();
    dummy.position.copy(position);
    // The local forward vector (+Z) points directly outward from center (0,0,0)
    dummy.lookAt(position.clone().multiplyScalar(2));
    return dummy.quaternion.clone();
  }, [position]);

  const geometry = useMemo(() => {
    // 32x32 segments for smooth curving
    // Scale the dimensions before applying the bend, so it sits perfectly curve-flush on the sphere
    const width = CARD_WIDTH * scale;
    const height = CARD_HEIGHT * scale;
    const geo = new THREE.PlaneGeometry(width, height, 32, 32);
    const pos = geo.attributes.position;
    
    // Curve the plane to match the sphere's surface
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      
      const theta = x / GLOBE_RADIUS;
      const phi = y / GLOBE_RADIUS;
      
      const newX = GLOBE_RADIUS * Math.sin(theta) * Math.cos(phi);
      const newY = GLOBE_RADIUS * Math.sin(phi);
      // Offset by GLOBE_RADIUS so its local center remains at (0,0,0)
      const newZ = GLOBE_RADIUS * Math.cos(theta) * Math.cos(phi) - GLOBE_RADIUS;
      
      pos.setXYZ(i, newX, newY, newZ);
    }
    
    geo.computeVertexNormals();
    return geo;
  }, [scale]);

  return (
    <mesh 
      position={position} 
      quaternion={rotationQuaternion}
      ref={meshRef} 
      geometry={geometry} 
      onClick={(e) => {
        e.stopPropagation();
        if (cardInfo) {
          onSelect(cardInfo.base64, cardInfo.location, cardInfo.info, project);
        }
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
        if (cardInfo && onHover) {
          onHover(cardInfo.info);
        }
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'auto';
        if (onHoverOut) {
          onHoverOut();
        }
      }}
    >
      {/* DoubleSide allows the interior views of the cards to be seen when passing through */}
      {texture && (
        <meshStandardMaterial 
          map={texture} 
          side={THREE.DoubleSide} 
          roughness={0.2}
          metalness={0.1}
          emissive={hovered ? new THREE.Color('#d4af37') : new THREE.Color('#000000')}
          emissiveIntensity={hovered ? 0.25 : 0.0}
          toneMapped={false} 
        />
      )}
    </mesh>
  );
}
