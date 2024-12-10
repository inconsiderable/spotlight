import {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import {
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonIcon,
  IonItem,
  IonList,
  IonRange,
  IonSearchbar,
  IonToggle,
  useIonModal,
  useIonViewWillEnter,
  useIonViewWillLeave,
} from '@ionic/react';
import ForceGraph3D from 'react-force-graph-3d';
import {
  CSS2DRenderer,
  CSS2DObject,
} from 'three/examples/jsm/renderers/CSS2DRenderer';
import { useKeyViewer } from '../keyViewer';
import { arrowBackOutline, optionsOutline, discOutline } from 'ionicons/icons';
import { AppContext } from '../../utils/appContext';
import { shortenB64 } from '../../utils/compat';
import { GraphLink, GraphNode } from '../../utils/appTypes';

const NODE_R = 3;
const extraRenderers = [new CSS2DRenderer()];

function FlowMap({
  forKey,
  setForKey,
  nodes,
  links,
  colorScheme,
  rankingFilter,
}: {
  forKey: string;
  setForKey: (pk: string) => void;
  nodes: GraphNode[];
  links: GraphLink[];
  rankingFilter: number;
  colorScheme: 'light' | 'dark';
  tipHeight: number;
}) {
  const [presentKV] = useKeyViewer(forKey);

  const handleNodeFocus = useCallback(
    (node: any, clicked: boolean = false) => {
      if (node?.pubkey === forKey && clicked) {
        presentKV({
          initialBreakpoint: 0.75,
          breakpoints: [0, 0.75, 1],
        });
      } else {
        setForKey(node?.pubkey);
      }
    },
    [forKey, setForKey, presentKV],
  );

  const initialNode = useMemo(
    () => nodes.find((n) => n.pubkey === forKey),
    [nodes, forKey],
  );

  useEffect(() => {
    handleNodeFocus(initialNode);
  }, [initialNode, handleNodeFocus]);

  const forceRef = useRef<any>();

  const maxWeight = useMemo(
    () => Math.max(...links.map((l) => l.value)),
    [links],
  );

  const [present, dismiss] = useIonModal(Filters, {
    onDismiss: () => dismiss(),
    value: rankingFilter,
  });

  const handleSearch = (ev: Event) => {
    const target = ev.target as HTMLIonSearchbarElement;
    if (!target) return;

    const value = target.value!;

    if (!value) {
      return;
    }

    if (new RegExp('[A-Za-z0-9/+]{43}=').test(value)) {
      setForKey(value);
    } else {
      //remove non Base64 characters eg: @&!; etc and pad with 00000
      const query = `${value.replace(/[^A-Za-z0-9/+]/gi, '').padEnd(43, '0')}=`;
      setForKey(query);
    }
  };

  const placeholderRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  // Update rect on mount and when window resizes
  useLayoutEffect(() => {
    function updateRect() {
      if (placeholderRef.current) {
        setRect(placeholderRef.current.getBoundingClientRect());
      }
    }
    updateRect();
    window.addEventListener('resize', updateRect);
    return () => window.removeEventListener('resize', updateRect);
  }, []);

  // Force a re-measure after initial paint
  useEffect(() => {
    setTimeout(() => {
      if (placeholderRef.current) {
        setRect(placeholderRef.current.getBoundingClientRect());
      }
    }, 0);
  }, []);

  useIonViewWillEnter(() => {
    const container = document.getElementById('fg-portal');
    if (container !== null) {
      container.style.display = 'block'; // Show portal container
    }
  }, []);

  useIonViewWillLeave(() => {
    const container = document.getElementById('fg-portal');
    if (container !== null) {
      container.style.display = 'none'; // Remove portal container
    }
  }, []);

  return (
    <IonCard>
      <IonCardHeader className="ion-padding-horizontal">
        <IonCardSubtitle
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <IonSearchbar
            debounce={1000}
            placeholder="Beginning"
            //searchIcon={discOutline}
            clearIcon={discOutline}
            cancelButtonIcon={arrowBackOutline}
            showCancelButton="focus"
            showClearButton="always"
            value={forKey}
            type="url"
            enterkeyhint="go"
            onIonChange={(ev) => handleSearch(ev)}
            onIonCancel={() => setForKey('0'.padEnd(43, '0') + '=')}
            onIonClear={() => setForKey('0'.padEnd(43, '0') + '=')}
          />
          <IonButton
            className="ion-no-padding"
            fill="clear"
            onClick={(e) => {
              e.stopPropagation();
              present({
                initialBreakpoint: 0.75,
                breakpoints: [0, 0.75, 1],
              });
            }}
          >
            <IonIcon color="primary" slot="icon-only" icon={optionsOutline} />
            <IonBadge
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                opacity: 0.9,
              }}
              className="ion-no-padding"
              color="danger"
            >
              2
            </IonBadge>
          </IonButton>
        </IonCardSubtitle>
      </IonCardHeader>
      <IonCardContent className="ion-no-padding">
        <div
          ref={placeholderRef}
          className="flow-graph-container"
          style={{
            width: '100%',
            height: '600px',
            position: 'relative',
            zIndex: 1,
            background: 'transparent',
          }}
        />
        {rect
          ? createPortal(
              <div
                style={{
                  position: 'fixed',
                  left: rect.left,
                  top: rect.top,
                  width: rect.width,
                  height: rect.height,
                  pointerEvents: 'auto',
                }}
              >
                <ForceGraph3D
                  ref={forceRef}
                  nodeRelSize={NODE_R}
                  extraRenderers={extraRenderers}
                  width={rect.width}
                  height={rect.height}
                  graphData={{ nodes, links }}
                  //linkColor={() => (colorScheme === 'light' ? '#55e816' : '#FE650D')}
                  linkWidth={(link) => 1}
                  linkDirectionalParticles={(link) =>
                    scaleEdgeWeight(link.value, maxWeight) * 5
                  }
                  linkDirectionalParticleSpeed={(link) =>
                    scaleEdgeWeight(link.value, maxWeight) * 0.01
                  }
                  nodeThreeObject={(node) => {
                    //{Number((forKey?.ranking ?? 0 / 1) * 100).toFixed(2)}%
                    //colorScheme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)';
                    const nodeEl = document.createElement('ion-badge');
                    nodeEl.className = 'force-node-badge';
                    nodeEl.textContent = node.label || shortenB64(node.pubkey);
                    nodeEl.style.color = node.color;
                    nodeEl.addEventListener('click', function (e) {
                      e.stopPropagation();
                      handleNodeFocus(node, true);
                    });
                    nodeEl.style.cursor = 'pointer';
                    nodeEl.style.pointerEvents = 'auto'; // Ensure badge is clickable
                    return new CSS2DObject(nodeEl);
                  }}
                  nodeThreeObjectExtend={true}
                  //onNodeClick={(p) => handleNodeFocus(p, true)}
                />
              </div>,
              document.getElementById('fg-portal')!,
            )
          : null}
      </IonCardContent>
    </IonCard>
  );
}

const scaleEdgeWeight = (weight: number, maxWeight: number) => {
  return Math.log2(2 + weight) / Math.log2(2 + maxWeight);
};

export default FlowMap;

export const Filters = ({
  onDismiss,
  value,
}: {
  onDismiss: () => void;
  value: string;
}) => {
  const { rankingFilter, setRankingFilter } = useContext(AppContext);

  return (
    <div className="ion-padding">
      <IonList>
        <IonItem>
          <IonRange
            aria-label="Ranking filter"
            labelPlacement="start"
            label={`Filter < ${value}%`}
            pin={true}
            pinFormatter={(value: number) => `${value}%`}
            onIonChange={({ detail }) => setRankingFilter(Number(detail.value))}
            value={rankingFilter}
          />
        </IonItem>
        <IonItem>
          <IonToggle>Toggle inflow/outflow</IonToggle>
        </IonItem>
        <IonItem>
          <IonToggle>Toggle snapshots</IonToggle>
        </IonItem>
        <IonItem>
          <IonToggle>Toggle knowledge/flow trees</IonToggle>
        </IonItem>
      </IonList>
    </div>
  );
};
