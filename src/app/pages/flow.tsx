import { PageShell } from '../components/pageShell';
import { useMind } from '../useCases/useMind';
import { useContext, useEffect, useState } from 'react';
import { AppContext } from '../utils/appContext';
import FlowMap from '../components/flowMap';
import { parseGraphDOT } from '../utils/compat';

const Flow = () => {
  const { selectedKey } = useMind();

  const { colorScheme, tipHeader, graphDOT, requestGraphDOT, rankingFilter } =
    useContext(AppContext);

  const tipHeight = tipHeader?.header.height ?? 0;

  const [peekGraphKey, setPeekGraphKey] = useState<string | null | undefined>();

  const whichKey =
    peekGraphKey ||
    selectedKey ||
    '0000000000000000000000000000000000000000000=';

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (whichKey) {
        requestGraphDOT(whichKey);
      }
    }, 0);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [whichKey, requestGraphDOT]);

  useEffect(() => {
    const resultHandler = (data: any) => {
      if (whichKey && data.detail) {
        requestGraphDOT(whichKey);
      }
    };

    document.addEventListener('inv_view', resultHandler);

    return () => {
      document.removeEventListener('inv_view', resultHandler);
    };
  }, [whichKey, requestGraphDOT]);

  const gdot = graphDOT(whichKey);

  const { nodes, links } = parseGraphDOT(gdot, whichKey, rankingFilter);

  return (
    <PageShell
      renderBody={() => (
        <>
          {!!whichKey && (
            <>
              {!!gdot && (
                <FlowMap
                  tipHeight={tipHeight}
                  forKey={whichKey}
                  nodes={nodes ?? []}
                  links={links ?? []}
                  setForKey={setPeekGraphKey}
                  rankingFilter={rankingFilter}
                  colorScheme={colorScheme}
                />
              )}
            </>
          )}
        </>
      )}
    />
  );
};

export default Flow;
