import React, { Component, Fragment } from "react";
import PropTypes from "prop-types";
import styled from "styled-components";
import { connect } from "react-redux";
import Modal, { ModalHeader, ModalBody, ModalFooter } from "@vz-soe-utils/modal";
import Button from "@vz-soe-utils/button";
import Form, { Input, Select } from "@vz-soe-utils/form";
import { HttpService } from "../../../services/HttpService";
import * as appLoaderActions from "../../common/AppLoader/actions";
import { emailValidation, emailValidtionReset, initLandingRequestNc } from "../../../pages/Landing/actions";
import { Input as VdsInput } from '@vds/inputs';
import * as appMessageActions from "../../common/AppMessage/actions";
import "./AccountInfo.css";

const FullHeightModal = styled(Modal)`
  width: 100% !important; 
  padding: 0px !important;
`;

const ModalContainer = styled.div`
  max-width: 64rem;
  margin: auto;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-bottom: 1rem;
  width: 50%;
`;

const FormLabel = styled.label`
  min-width: 40%;
  flex: 1;
  padding-left: 24px;
  margin-top: -24px;
  font-size: 16px !important;

  ${(props) => props.required && `
    &&:after {
      content: '*';
      color: #FF0000;
      font-weight: bold;
      font-sie: 16px;
    }
  `}
`;

const FieldContainer = styled.div`
  flex: auto;
  margin: 0px 12px 24px 12px;
  position: relative;
`;

const InputField = styled(Input)`
  width: 100%;
`;

const SelectField = styled(Select)`
  flex: auto;
  width: 100%;
  height: 42px;
  padding: 0px 1rem !important;
`;

const FixedModalBody = styled(ModalBody)`
  padding: 24px !important;
  overflow: auto;
  margin-bottom: 64px;
`;

const CheckboxField = styled(VdsInput)`
  margin-left: 29px;
  margin-top:20px;
`;

const ValidationError = styled.span`
  color: #FF0000;
  font-size: 14px;
  position: absolute;
  bottom: -22px;
  left: 0px;
`;

const Row = styled.div`
  display: flex;
`;

const ACCOUNT_VALIDATION_MSGS = {
  firstName: "First Name is required",
  lastName: "Last Name is required",
  businessName: "Business Name is required",
  streetNumber: "Street Number is required",
  streetName: "Street Name is required",
  zipCode: "Please enter a valid 5-digit zip code",
  cityAndState: "Please select a city & state",
  canBeReached: "Please enter a valid phone number",
  email: "Please enter a valid email address",
};

class AccountInfoPrepay extends Component {
  constructor(props) {
    super(props);
    this.state = {
      formData: {
        firstName: "",
        lastName: "",
        midInitial: "",
        suffix: "",
        streetNumber: "",
        streetName: "",
        direction: "",
        streetType: "",
        apartment: "",
        zipCode: "",
        zipCodePlus4: "",
        cityAndState: "",
        city: "",
        state: "",
        canBeReached: "",
        email: "",
        updateCustomerAccount: false,
      },
      formValidationErrors: {
        firstName: "",
        lastName: "",
        streetNumber: "",
        streetName: "",
        direction: "",
        streetType: "",
        zipCode: "",
        cityAndState: "",
        canBeReached: "",
        email: "",
        inValidEmailStatus: ""
      },
      cityStatesList: [],
      isBusinessAccount: false,
      fieldsToBeDisabled: [],
      prevValidatedZipCode: "",
      skipMissedProfileEmailValidation: false,
      customerProvidedAddress: false,
      reasoncode: "",
      reasonForDecline: "",
      emailId: ""
    };
  }

  static propTypes = {
    landingFailureResp: PropTypes.object
  }

  componentWillUnmount(){

  }

  componentDidMount() {
    console.log("componentDidMount",this.props.createCaseFailData);
    const AddressLine1 = this.props?.createCaseFailData?.customer?.customerProfileInfoCart?.addressLine1;
    const AddressArray = AddressLine1?.split(" ");
    const streetNumber = AddressArray?.shift();
    const streetType = AddressArray?.pop();
    const streetName = AddressArray?.join(" ");
    this.setState(prevState => {
      let formData = Object.assign({}, prevState.formData);
      formData.firstName = this.props?.createCaseFailData?.customer?.customerProfileInfoCart?.firstName;
      formData.lastName = this.props?.createCaseFailData?.customer?.customerProfileInfoCart?.lastName;
      formData.email = this.props?.createCaseFailData?.customer?.customerProfileInfoCart?.email;
      formData.city = this.props?.createCaseFailData?.customer?.customerProfileInfoCart?.city;
      formData.state = this.props?.createCaseFailData?.customer?.customerProfileInfoCart?.state;
      formData.zipCode = this.props?.createCaseFailData?.customer?.customerProfileInfoCart?.zipCode;
      formData.canBeReached = this.props?.createCaseFailData?.customer?.customerProfileInfoCart?.phoneNumber;
      formData.zipCodePlus4 = this.props?.createCaseFailData?.customer?.customerProfileInfoCart?.zipCode4;
      formData.streetNumber = streetNumber;
      formData.streetName = streetName;
      formData.streetType = streetType;
      // formData.addressLine2 = this.props.createCaseFailData.addressLine2;
      return { formData };
    })
  }

  componentDidUpdate = (prevProps) => {
    console.log("this.props.emailValidationStatus_prevProps.emailValidationStatus",this.props.emailValidationStatus,prevProps.emailValidationStatus);
    if (prevProps.emailValidationStatus !== this.props.emailValidationStatus && this.props.emailValidationStatus != "") {
      const { emailValidationStatus } = this.props;
      let formValidationErrors = this.state.formValidationErrors;
      if (emailValidationStatus === "Valid") {
        formValidationErrors["email"] = "";
      } else if (emailValidationStatus === "Invalid") {
        formValidationErrors["email"] = "";
        formValidationErrors["inValidEmailStatus"] = ACCOUNT_VALIDATION_MSGS["email"];
      } else if (emailValidationStatus === "Fake") {
        formValidationErrors["email"] = ACCOUNT_VALIDATION_MSGS["email"];
      } else if (emailValidationStatus === "Manual_validation") {
        const emailRegEx = /^([\w.%+-]+)@([\w-]+\.)+([\w]{2,})$/;
        let isValid = emailRegEx.test(this.state.emailId);
        if (isValid) {
          formValidationErrors["email"] = "";
        } else {
          formValidationErrors["email"] = ACCOUNT_VALIDATION_MSGS["email"];
        }
      }
      this.props.emailValidtionReset();
      this.setState({ formValidationErrors });
    }
  }

  onHandleEmailChange = (evt) => {
    const value = evt.target.value.replace(/\s/g, '');
    const emailRegEx = /^([\w.%+-]+)@([\w-]+\.)+([\w]{2,})$/;
    let isValid = emailRegEx.test(value);
    let formData = this.state.formData;
    let formValidationErrors = this.state.formValidationErrors;
    formData['email'] = value;
    this.props.createCaseFailData.customer.customerProfileInfoCart.email=value;
    if (!isValid) {
      formValidationErrors["email"] = ACCOUNT_VALIDATION_MSGS["email"];
    } else {
      formValidationErrors["email"] = "";
      formValidationErrors["inValidEmailStatus"] = "";
    }
    this.setState({ formData, emailId: value, formValidationErrors });
  }

  onHandleEmailBlur = (e) => {
    if (this.state.formValidationErrors["email"] == "" && e.target.value !== "") {
      const value = e.target.value.replace(/\s/g, '');
      console.log("this.props?.createCaseFailData?.email",this.props.createCaseFailData?.customer?.customerProfileInfoCart?.email);
      this.props.emailValidation(value);
    }
  }

  onHandleCheckboxChange = () => {
    let formData = this.state.formData;
    formData["updateCustomerAccount"] = !formData.updateCustomerAccount;
    this.setState({
      formData,
    });
  }

  isDisabled = (field) => {
    return this.state.fieldsToBeDisabled.indexOf(field) > -1;
  }

  continueClick = () => {
    window.store.dispatch(appLoaderActions.show())
    const formData = this.state.formData;
    const BASE_URL = sessionStorage.getItem("APIContext") + '/accountlandingservice/updateEmailToEPS';
    const req ={
      "userInfo": {
        "userId": "v726886",
        "userClass": "160"
      },
      "profileInfo":{
        "email": formData?.email,
      },
      "mdn": formData?.canBeReached
    }
    this.state.formData.updateCustomerAccount && HttpService.post(BASE_URL, req).then(res => {
      if (res && res.data) {
        const { data } = res;
        console.log("dataEPS",data);
      }
      window.store.dispatch(appLoaderActions.hide());
    }).catch(e => {
      console.log("Error Occured", e);
      window.store.dispatch(appLoaderActions.hide());
    });
    if(this.state.formData.updateCustomerAccount){
      window.store.dispatch(appLoaderActions.show());
      this.props.initLandingRequestNc("", "", localStorage.getItem("channel"));
      window.store.dispatch(appLoaderActions.hide());
    }
    else{
      window.store.dispatch(appLoaderActions.show());
      this.props.initLandingRequestNc("", "", localStorage.getItem("channel"),"","","","","","","","","",this.props?.createCaseFailData?.customer?.customerProfileInfoCart);
      window.store.dispatch(appLoaderActions.hide());
    }
    window.store.dispatch(appLoaderActions.hide());
    this.props.unmountMe();
  }

  render() {
    console.log("this.props.emailvalidationStatus",this.props.emailValidationStatus);
    console.log(this.props.createCaseFailData)
    const isExistingCustomerPostToPre = sessionStorage.getItem("newPostToPreIndicator") === "true" && sessionStorage.getItem("customerType") === "U" ? true : false;
    const citystate = this.props.createCaseFailData?.customer?.customerProfileInfoCart?.city + `-` + this.props.createCaseFailData?.customer?.customerProfileInfoCart?.state;
    const header = (
      <div data-testid='AccountInfo' className="u-paddingXSmall u-paddingYLarge u-floatClearFix u-borderBottomGray">
        <span className="u-textBold u-text18 u-colorPrimary">
          Account Information
        </span>
      </div>
    );
    const { formData, formValidationErrors, reasoncode, skipMissedProfileEmailValidation } = this.state;

    const content = (
      <Fragment>
        <Row>
          <FormGroup>
            <FormLabel required>First Name</FormLabel>
            <FieldContainer>
              <InputField
                name="firstName"
                value={formData.firstName}
                placeholder={"First Name"}
                disabled={true}
                className="contains-PII"
              />
            </FieldContainer>
          </FormGroup>
            <FormGroup>
              <FormLabel required>Last Name</FormLabel>
              <FieldContainer>
                <InputField
                  name="lastName"
                  value={formData.lastName}
                  placeholder="Last Name"
                  disabled={true}
                  className="contains-PII"
                />
              </FieldContainer>
            </FormGroup>
        </Row>
        <Row>
          <FormGroup>
            <FormLabel>Mid Init.</FormLabel>
            <FieldContainer>
              <InputField
                name="midInitial"
                value={formData.midInitial}
                placeholder="Initials"
                disabled={true}
              />
            </FieldContainer>
          </FormGroup>
          <FormGroup>
            <FormLabel>Suffix</FormLabel>
            <FieldContainer>
              <InputField
                name="suffix"
                value={formData.suffix}
                placeholder="Suffix"
                disabled={true}
              />
            </FieldContainer>
          </FormGroup>
        </Row>
        <Row>
          <FormGroup>
            <FormLabel required>Street Number</FormLabel>
            <FieldContainer>
              <InputField
                name="streetNumber"
                value={formData.streetNumber}
                placeholder="Street Number"
                disabled={true}
              />
            </FieldContainer>
          </FormGroup>
          <FormGroup>
            <FormLabel required>Street Name</FormLabel>
            <FieldContainer>
              <InputField
                name="streetName"
                value={formData.streetName}
                placeholder="Street Name"
                disabled={true}
                className="contains-PII"
              />
            </FieldContainer>
          </FormGroup>
        </Row>
        <Row>
          <FormGroup>
            <FormLabel>Direction</FormLabel>
            <FieldContainer>
              <SelectField
                name="direction"
                value={formData.direction}
                disabled={true}
              >
              </SelectField>
            </FieldContainer>
          </FormGroup>
          <FormGroup>
            <FormLabel>Street Type</FormLabel>
            <FieldContainer>
            <InputField
                name="streetType"
                value={formData.streetType}
                placeholder="Street Type"
                disabled={true}
                className="contains-PII"
              />
            </FieldContainer>
          </FormGroup>
        </Row>
        <Row>
          <FormGroup>
            <FormLabel>Apt/Suite</FormLabel>
            <FieldContainer>
              <InputField
                name="apartment"
                value={formData.apartment}
                placeholder="Apartment"
                disabled={true}
                className="contains-PII"
              />
            </FieldContainer>
          </FormGroup>
        </Row>
        <Row>
          <FormGroup>
            <FormLabel required>Zip Code</FormLabel>
            <FieldContainer>
              <div style={{ display: "flex" }}>
                <InputField
                  name="zipCode"
                  onBlur={this.validateZipCode}
                  value={formData.zipCode}
                  placeholder="5 digits"
                  disabled={true}
                  className="contains-PII"
                />
                <InputField
                  style={{ marginLeft: 12 }}
                  name="zipCodePlus4"
                  value={formData.zipCodePlus4}
                  placeholder="0000"
                  disabled={true}
                  className="contains-PII"
                />
              </div>
            </FieldContainer>
          </FormGroup>
          <FormGroup>
            <FormLabel required>CityState</FormLabel>
            <FieldContainer>
              <InputField
                name="cityAndState"
                value={citystate}
                placeholder="City-State"
                disabled={true}
                className="contains-PII"
              />
            </FieldContainer>
          </FormGroup>
        </Row>
        <Row>
          <FormGroup>
            <FormLabel required>Can be Reached</FormLabel>
            <FieldContainer>
              <InputField
                name="canBeReached"
                // onChange={this.onHandleChange}
                value={formData.canBeReached}
                placeholder="Can be Reached"
                // disabled={this.isDisabled("canBeReached")}
                disabled={true}
              />
            </FieldContainer>
          </FormGroup>
          <FormGroup>
            <FormLabel required>Email Address</FormLabel>
            <FieldContainer>
              <VdsInput
                name="email"
                onChange={this.onHandleEmailChange}
                // onBlur={(e) => this.onHandleEmailBlur('email')}
                onBlur={e=>this.onHandleEmailBlur(e)}
                // value={!skipMissedProfileEmailValidation ? formData.email : ""}
                value={formData.email}
                placeholder="Email"
                disabled={this.isDisabled("email")}
                required={false}
                className="contains-PII"
              />
              {((formValidationErrors.email || formValidationErrors.inValidEmailStatus)) ? <ValidationError>{formValidationErrors.inValidEmailStatus ? formValidationErrors.inValidEmailStatus : formValidationErrors.email}</ValidationError> : ""}
            </FieldContainer>
          </FormGroup>
        </Row>
        <Fragment>
          <Row>
            <CheckboxField
              type="checkbox"
              name="updateCustomerAccount"
              onChange={this.onHandleCheckboxChange}
              selected={formData.updateCustomerAccount}>
              Update the customer account
            </CheckboxField>
          </Row>
        </Fragment>
        <div className="u-textCenter whiteBackGround">
          <Button
            disabled={formValidationErrors.email === "" && formData.email !== "" ? false : true}
            onClick={this.continueClick}
          >
            Continue</Button>
        </div>
      </Fragment>
    );

    // const footer = (
    //   <div className="u-textCenter whiteBackGround">
    //     <Button data-track="Continue"
    //       // disabled={reasoncode == "" && skipMissedProfileEmailValidation} 
    //       type="submit">Continue</Button>
    //     {this.props.isRfexFlow ? <Button data-track="Close" className={"SearchButton"}
    //       style={{ backgroundColor: 'white', font: 'bold', borderColor: 'black', color: 'black' }}
    //       onClick={() => { this.props.closeModal() }}
    //     >{"Close"}
    //     </Button> : null}

    //   </div>
    // );
    return (
      <div className="AccountInfoPage">
        <FullHeightModal
          fullscreen
          showModal
          ariaLabel="Account Information"
          closeButton=""
          className="AccountInfoModal"
        >
          <ModalContainer>
            <Form>
              <ModalHeader>{header}</ModalHeader>
              <FixedModalBody>{content}</FixedModalBody>
              {/* <ModalFooter>{footer}</ModalFooter> */}
            </Form>
          </ModalContainer>
        </FullHeightModal>
      </div>
    );
  }
}

export const mapDispatchToProps = (dispatch) => ({
  emailValidation: (data) => dispatch(emailValidation(data)),
  emailValidtionReset: () => dispatch(emailValidtionReset()),
  initLandingRequestNc: (accountNo, lookupMtn, channel, orderLocationCode, repId, regNo, caseId, cartId, newCustomerWithoutCredit, loggedInUser, qaFlowData,customerType, createCaseFailData) =>
  dispatch(initLandingRequestNc(accountNo, lookupMtn, channel, orderLocationCode, repId, regNo, caseId, cartId, newCustomerWithoutCredit, loggedInUser, qaFlowData,customerType, createCaseFailData)),
});

const withConnect = connect(null, mapDispatchToProps);

export default withConnect(AccountInfoPrepay);


