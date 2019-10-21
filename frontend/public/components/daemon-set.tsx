import * as React from 'react';
import { Link } from 'react-router-dom';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';

import { K8sResourceKind } from '../module/k8s';
import { DetailsPage, ListPage, Table, TableRow, TableData } from './factory';
import {
  AsyncComponent,
  DetailsItem,
  Kebab,
  KebabAction,
  ContainerTable,
  detailsPage,
  LabelList,
  navFactory,
  ResourceKebab,
  ResourceLink,
  ResourceSummary,
  SectionHeading,
  Selector,
} from './utils';
import { ResourceEventStream } from './events';
import { VolumesTable } from './volumes-table';
import { DaemonSetModel } from '../models';

export const menuActions: KebabAction[] = [
  Kebab.factory.AddStorage,
  ...Kebab.getExtensionsActionsForKind(DaemonSetModel),
  ...Kebab.factory.common,
];

const kind = 'DaemonSet';

const tableColumnClasses = [
  classNames('col-lg-2', 'col-md-3', 'col-sm-4', 'col-xs-6'),
  classNames('col-lg-2', 'col-md-3', 'col-sm-4', 'col-xs-6'),
  classNames('col-lg-3', 'col-md-4', 'col-sm-4', 'hidden-xs'),
  classNames('col-lg-2', 'col-md-2', 'hidden-sm', 'hidden-xs'),
  classNames('col-lg-3', 'hidden-md', 'hidden-sm', 'hidden-xs'),
  Kebab.columnClass,
];

const DaemonSetTableHeader = () => {
  return [
    {
      title: 'Name',
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: 'Namespace',
      sortField: 'metadata.namespace',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: 'Labels',
      sortField: 'metadata.labels',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Status',
      sortFunc: 'daemonsetNumScheduled',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: 'Pod Selector',
      sortField: 'spec.selector',
      transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[5] },
    },
  ];
};
DaemonSetTableHeader.displayName = 'DaemonSetTableHeader';

const DaemonSetTableRow = ({
  obj: daemonset,
  index,
  key,
  style,
}: {
  obj: K8sResourceKind;
  index: number;
  key: string;
  style: any;
}) => {
  return (
    <TableRow id={daemonset.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind={kind}
          name={daemonset.metadata.name}
          namespace={daemonset.metadata.namespace}
          title={daemonset.metadata.uid}
        />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
        <ResourceLink
          kind="Namespace"
          name={daemonset.metadata.namespace}
          title={daemonset.metadata.namespace}
        />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <LabelList kind={kind} labels={daemonset.metadata.labels} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <Link
          to={`/k8s/ns/${daemonset.metadata.namespace}/daemonsets/${daemonset.metadata.name}/pods`}
          title="pods"
        >
          {daemonset.status.currentNumberScheduled} of {daemonset.status.desiredNumberScheduled}{' '}
          pods
        </Link>
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        <Selector selector={daemonset.spec.selector} namespace={daemonset.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={daemonset} />
      </TableData>
    </TableRow>
  );
};
DaemonSetTableRow.displayName = 'DaemonSetTableRow';

export const DaemonSetDetailsList: React.FC<DaemonSetDetailsListProps> = ({ ds }) => (
  <dl className="co-m-pane__details">
    <DetailsItem label="Current Count" obj={ds} path="status.currentNumberScheduled" />
    <DetailsItem label="Desired Count" obj={ds} path="status.desiredNumberScheduled" />
  </dl>
);

const DaemonSetDetails: React.FC<DaemonSetDetailsProps> = ({ obj: daemonset }) => (
  <>
    <div className="co-m-pane__body">
      <SectionHeading text="Daemon Set Overview" />
      <div className="row">
        <div className="col-lg-6">
          <ResourceSummary resource={daemonset} showPodSelector showNodeSelector showTolerations />
        </div>
        <div className="col-lg-6">
          <DaemonSetDetailsList ds={daemonset} />
        </div>
      </div>
    </div>
    <div className="co-m-pane__body">
      <SectionHeading text="Containers" />
      <ContainerTable containers={daemonset.spec.template.spec.containers} />
    </div>
    <div className="co-m-pane__body">
      <VolumesTable resource={daemonset} heading="Volumes" />
    </div>
  </>
);

const EnvironmentPage: React.FC<EnvironmentPageProps> = (props) => (
  <AsyncComponent
    loader={() => import('./environment.jsx').then((c) => c.EnvironmentPage)}
    {...props}
  />
);

const envPath = ['spec', 'template', 'spec', 'containers'];
const EnvironmentTab: React.FC<EnvironmentTabProps> = (props) => (
  <EnvironmentPage
    obj={props.obj}
    rawEnvData={props.obj.spec.template.spec}
    envPath={envPath}
    readOnly={false}
  />
);
const { details, pods, editYaml, envEditor, events } = navFactory;
export const DaemonSets: React.FC = (props) => (
  <Table
    {...props}
    aria-label="Daemon Sets"
    Header={DaemonSetTableHeader}
    Row={DaemonSetTableRow}
    virtualize
  />
);

export const DaemonSetsPage: React.FC<DaemonSetsPageProps> = (props) => (
  <ListPage canCreate={true} ListComponent={DaemonSets} kind={kind} {...props} />
);

export const DaemonSetsDetailsPage: React.FC<DaemonSetsDetailsPageProps> = (props) => (
  <DetailsPage
    {...props}
    kind={kind}
    menuActions={menuActions}
    pages={[
      details(detailsPage(DaemonSetDetails)),
      editYaml(),
      pods(),
      envEditor(EnvironmentTab),
      events(ResourceEventStream),
    ]}
  />
);

type DaemonSetDetailsListProps = {
  ds: K8sResourceKind;
};

type EnvironmentPageProps = {
  obj: K8sResourceKind;
  rawEnvData: any;
  envPath: string[];
  readOnly: boolean;
};

type EnvironmentTabProps = {
  obj: K8sResourceKind;
};

type DaemonSetDetailsProps = {
  obj: K8sResourceKind;
};

type DaemonSetsPageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
};

type DaemonSetsDetailsPageProps = {
  match: any;
};