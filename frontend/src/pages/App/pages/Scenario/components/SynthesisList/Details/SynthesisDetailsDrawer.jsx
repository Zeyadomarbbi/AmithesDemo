import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation, Outlet } from 'react-router-dom';
import DrawerDetails from './components/DrawerDetails';
import DrawerLoadingSkeleton from './components/DrawerLoadingSkeleton';
import useScenarioSynthesis from './utils/useScenarioSynthesis';
import { useShareClasses } from '../../../../../hooks/useShareClass';
import './SynthesisDetailsDrawer.css';

function SynthesisDetailsDrawer() {
    const { fundId, synthesisId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [isExpanded, setIsExpanded] = useState(false);

    const { synthesis, loading: synLoading, error: synError } = useScenarioSynthesis(fundId, synthesisId);
    const { data: shareClasses, isLoading: scLoading } = useShareClasses(fundId);

    const { synthesisTitle, synthesisDescription, synthesisLinks } = location.state || {};

    const handleClose = () => navigate(`/funds/${fundId}/scenario-dashboard`);
    const handleToggleExpand = () => setIsExpanded(!isExpanded);

    const kpiBlueprint = useMemo(() => {
        if (!shareClasses) return [];
        
        const blueprint = [
            { id: 'irr_net', name: 'Fund Net IRR', type: 'pct', data: {}, isExpandable: false },
        ];

        shareClasses.forEach(sc => {
            blueprint.push({ id: `irr_share_${sc.share_class_id}`, name: `${sc.share_class_name} IRR`, type: 'pct', data: {}, isExpandable: false });
        });

        blueprint.push(
            { id: 'irr_portfolio', name: 'Portfolio IRR', type: 'pct', data: {}, isExpandable: false },
            { id: 'tvpi_fund', name: 'Fund TVPI', type: 'multiple', data: {}, isExpandable: false }
        );

        shareClasses.forEach(sc => {
            blueprint.push({ id: `tvpi_share_${sc.share_class_id}`, name: `${sc.share_class_name} TVPI`, type: 'multiple', data: {}, isExpandable: false });
        });

        blueprint.push(
            { id: 'moic_portfolio', name: 'Portfolio MOIC', type: 'multiple', data: {}, isExpandable: true },
            { id: 'duration_avg', name: 'Average duration', type: 'years', data: {}, isExpandable: true },
            { id: 'hurdle', name: 'Hurdle', type: 'number', data: {}, isExpandable: false },
            { id: 'distributed_total', name: 'Total distributed', type: 'number', data: {}, isExpandable: false },
            { id: 'management_fees', name: 'Management fees', type: 'number', data: {}, isExpandable: false },
            { id: 'due_diligence_fees', name: 'Due diligence fees', type: 'number', data: {}, isExpandable: false }
        );

        return blueprint;
    }, [shareClasses]);

    const isLoading = synLoading || scLoading;

    return (
        <div className="drawer-overlay" onClick={handleClose}>
            <div
                className={`drawer-container ${isExpanded ? 'expanded' : ''}`}
                onClick={(e) => e.stopPropagation()}
            >
                {isLoading ? (
                    <DrawerLoadingSkeleton />
                ) : synError ? (
                    <div className="drawer-error">Failed to load synthesis: {synError}</div>
                ) : synthesisId && !location.pathname.includes('child-tab-name') ? (
                    <DrawerDetails
                        fundId={fundId}
                        synthesisId={synthesisId}
                        onClose={handleClose}
                        onExpand={handleToggleExpand}
                        isExpanded={isExpanded}
                        title={synthesis?.synthesis_name || synthesisTitle || `Synthesis #${synthesisId}`}
                        description={synthesis?.description || synthesisDescription}
                        synthesisLinks={synthesisLinks}
                        scenarios={synthesis?.scenarios || []}
                        blueprint={kpiBlueprint}
                    />
                ) : (
                    <Outlet />
                )}
            </div>
        </div>
    );
}

export default SynthesisDetailsDrawer;