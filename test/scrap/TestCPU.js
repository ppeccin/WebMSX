/**
 * Created by ppeccin on 15/05/2015.
 */



    Z = new Z80();
    R = new Ram64K();

    Z.connectBus(R);
    Z.powerOn();

    // Z.trace = true;
    // Z.runCycles(100000);
