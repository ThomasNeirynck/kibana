export default function User($injector) {
  return {
    /**
     * @return null, if security services are not available OR undefined if user is not signed-in OR signed-in user object
     **/
    getCurrent() {
      if (!$injector.has('ShieldUser')) {
        return null;
      }

      const ShieldUser = $injector.get('ShieldUser');
      return ShieldUser.getCurrent();
    }
  };
}
