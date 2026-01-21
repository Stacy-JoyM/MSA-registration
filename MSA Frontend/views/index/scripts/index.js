import "../styles/index_responsive.css";

import "../../home/styles/home_responsive.css";
import "../../contact/styles/contact_responsive.css";
import "../../privacy-policy/styles/privacy_policy_responsive.css";
import "../../little-giants/styles/little_giants_responsive.css";
import "../../msa-factory/styles/msa_factory_responsive.css";
import "../../propulse/styles/propulse_responsive.css";
import "../../impact/styles/impact_responsive.css";
import "../../gallery/styles/gallery_responsive.css";

import ResponsiveImagesUtils from "../../../global/responsive-images/responsive_images_utils";

function initWeb(){

    ResponsiveImagesUtils.getLivingInstance("imagekit");
}

initWeb();