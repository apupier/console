import * as React from 'react';
import * as _ from 'lodash';
import * as fuzzy from 'fuzzysearch';
import { useFormikContext, FormikValues } from 'formik';
import { FormGroup, TextInputTypes, Alert } from '@patternfly/react-core';
import { InputField, getFieldId, ResourceDropdownField, RadioGroupField } from '@console/shared';
import { K8sResourceKind } from '@console/internal/module/k8s';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { EventingBrokerModel } from '../../../models';
import {
  knativeServingResourcesServices,
  knativeEventingResourcesBroker,
} from '../../../utils/get-knative-resources';
import { getDynamicChannelResourceList } from '../../../utils/fetch-dynamic-eventsources-utils';
import { sourceSinkType } from '../import-types';

interface SinkSectionProps {
  namespace: string;
}

interface SinkResourcesProps {
  namespace: string;
}

const SinkUri: React.FC = () => (
  <>
    <InputField
      type={TextInputTypes.text}
      name="sink.uri"
      placeholder="Enter URI"
      data-test-id="sink-section-uri"
      required
    />
    <div className="help-block">
      A Universal Resource Indicator where events are going to be delivered. Ex.
      &quot;http://cluster.example.com/svc&quot;
    </div>
  </>
);

const SinkResources: React.FC<SinkResourcesProps> = ({ namespace }) => {
  const [resourceAlert, setResourceAlert] = React.useState(false);
  const { setFieldValue, setFieldTouched, validateForm, initialValues } = useFormikContext<
    FormikValues
  >();
  const autocompleteFilter = (strText, item): boolean => fuzzy(strText, item?.props?.name);
  const fieldId = getFieldId('sink-name', 'dropdown');
  const onChange = React.useCallback(
    (selectedValue, valueObj) => {
      const modelData = valueObj?.props?.model;
      if (selectedValue && modelData) {
        const { apiGroup, apiVersion, kind } = modelData;
        setFieldValue('sink.name', selectedValue);
        setFieldTouched('sink.name', true);
        setFieldValue('sink.apiVersion', `${apiGroup}/${apiVersion}`);
        setFieldTouched('sink.apiVersion', true);
        setFieldValue('sink.kind', kind);
        setFieldTouched('sink.kind', true);
        validateForm();
      }
    },
    [setFieldValue, setFieldTouched, validateForm],
  );
  const contextAvailable = !!initialValues.sink.name;
  const resourcesData = [
    ...knativeServingResourcesServices(namespace),
    ...getDynamicChannelResourceList(namespace),
    ...knativeEventingResourcesBroker(namespace),
  ];

  const handleOnLoad = (resourceList: { [key: string]: string }) =>
    _.isEmpty(resourceList) ? setResourceAlert(true) : setResourceAlert(false);

  // filter out channels backing brokers
  const resourceFilter = (resource: K8sResourceKind) => {
    const {
      metadata: { ownerReferences },
    } = resource;
    return !ownerReferences?.length || ownerReferences[0].kind !== EventingBrokerModel.kind;
  };
  return (
    <FormGroup
      fieldId={fieldId}
      helperText={!contextAvailable ? 'This resource will be the Sink for the Event Source.' : ''}
      isRequired
    >
      {resourceAlert && (
        <>
          <Alert variant="default" title="No resources available" isInline>
            Select the URI option, or exit this form and create a Knative Service, Broker, or
            Channel first.
          </Alert>
          &nbsp;
        </>
      )}
      <ResourceDropdownField
        name="sink.name"
        resources={resourcesData}
        dataSelector={['metadata', 'name']}
        fullWidth
        placeholder="Select resource"
        showBadge
        disabled={contextAvailable || resourceAlert}
        onChange={onChange}
        autocompleteFilter={autocompleteFilter}
        autoSelect
        resourceFilter={resourceFilter}
        onLoad={handleOnLoad}
      />
    </FormGroup>
  );
};

const SinkSection: React.FC<SinkSectionProps> = ({ namespace }) => {
  return (
    <FormSection
      title="Sink"
      subTitle="Add a Sink to route this Event Source to a Channel, Broker, Knative Service or another route."
      extraMargin
    >
      <RadioGroupField
        name="sinkType"
        options={[
          {
            label: sourceSinkType.Resource.label,
            value: sourceSinkType.Resource.value,
            activeChildren: <SinkResources namespace={namespace} />,
          },
          {
            label: sourceSinkType.Uri.label,
            value: sourceSinkType.Uri.value,
            activeChildren: <SinkUri />,
          },
        ]}
      />
    </FormSection>
  );
};

export default SinkSection;
